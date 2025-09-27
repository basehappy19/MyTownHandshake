import { Prisma } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";

const getReportRoute: FastifyPluginAsync = async (fastify) => {
    fastify.get("/user/reports", async (req, reply) => {
        const { device_id, q } = req.query as {
            device_id?: string;
            q?: string;
        };
        const { page = "1", pageSize = "10" } = req.query as {
            page?: string;
            pageSize?: string;
        };

        const ps = Math.min(50, Math.max(1, Number(pageSize) || 10));

        // ฟิลเตอร์จาก device_id (ถ้ามี)
        const deviceFilter: Prisma.ReportWhereInput | undefined =
            device_id && device_id.trim()
                ? { device_id: device_id.trim() }
                : undefined;

        // ฟิลเตอร์จากคำค้นหา q (ถ้ามี) — ค้นหาจาก detail และ address.*
        const qTrim = q?.trim();
        const searchFilter: Prisma.ReportWhereInput | undefined = qTrim
            ? {
                  OR: [
                      { detail: { contains: qTrim, mode: "insensitive" } },
                      {
                          address: {
                              OR: [
                                  {
                                      address_full: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address_country: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address_state: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address_county: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address_city: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address_town_borough: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address_village_suburb: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address_neighbourhood: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address_any_settlement: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address_major_streets: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address_major_and_minor_streets: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                                  {
                                      address_building: {
                                          contains: qTrim,
                                          mode: "insensitive",
                                      },
                                  },
                              ],
                          },
                      },
                  ],
              }
            : undefined;

        // รวมเงื่อนไขทั้งหมด
        const where: Prisma.ReportWhereInput | undefined =
            deviceFilter || searchFilter
                ? { AND: [deviceFilter ?? {}, searchFilter ?? {}] }
                : undefined;

        const [total, reports] = await fastify.prisma.$transaction(
            async (tx: Prisma.TransactionClient) => {
                const total = await tx.report.count({ where });

                const totalPages = Math.ceil(total / ps);
                const rawP = Number(page) || 1;
                const p =
                    totalPages > 0
                        ? Math.min(totalPages, Math.max(1, rawP))
                        : 1;
                const skip = (p - 1) * ps;

                const reports = await tx.report.findMany({
                    where,
                    skip,
                    take: ps,
                    orderBy: { created_at: "desc" },
                    select: {
                        id: true,
                        detail: true,
                        img: true,
                        category: { select: { name: true } },
                        histories: {
                            orderBy: { changed_at: "desc" },
                            select: {
                                from: true,
                                to: true,
                                note: true,
                                changed_at: true,
                                img_before: true,
                                img_after: true,
                                finished: true,
                            },
                        },
                        address: {
                            select: {
                                lat: true,
                                lng: true,
                                address_full: true,
                                address_country: true,
                                address_state: true,
                                address_county: true,
                                address_city: true,
                                address_town_borough: true,
                                address_village_suburb: true,
                                address_neighbourhood: true,
                                address_any_settlement: true,
                                address_major_streets: true,
                                address_major_and_minor_streets: true,
                                address_building: true,
                            },
                        },
                        responsible: { select: { display_name: true } },
                        created_at: true,
                    },
                });

                return [total, reports] as const;
            }
        );

        const totalPages = Math.ceil(total / ps);
        const rawP = Number(page) || 1;
        const p = totalPages > 0 ? Math.min(totalPages, Math.max(1, rawP)) : 1;

        return reply.send({
            ok: true,
            page: p,
            pageSize: ps,
            total,
            totalPages,
            items: reports,
        });
    });
    fastify.get("/user/report/:id", async (req, reply) => {
        const { id } = req.params as { id: string };

        const report = await fastify.prisma.report.findUnique({
            where: { id },
            select: {
                id: true,
                detail: true,
                img: true,
                category: { select: { name: true } },
                histories: {
                    orderBy: { changed_at: "desc" },
                    select: {
                        id: true,
                        from: true,
                        to: true,
                        note: true,
                        changed_at: true,
                        img_before: true,
                        img_after: true,
                        finished: true,
                    },
                },
                address: {
                    select: {
                        lat: true,
                        lng: true,
                        address_full: true,
                        address_country: true,
                        address_state: true,
                        address_county: true,
                        address_city: true,
                        address_town_borough: true,
                        address_village_suburb: true,
                        address_neighbourhood: true,
                        address_any_settlement: true,
                        address_major_streets: true,
                        address_major_and_minor_streets: true,
                        address_building: true,
                    },
                },
                responsible: { select: { display_name: true } },
                created_at: true,
            },
        });

        if (!report) {
            return reply
                .code(404)
                .send({ ok: false, error: "Report not found" });
        }

        return reply.send({ ok: true, item: report });
    });
};

export { getReportRoute };
