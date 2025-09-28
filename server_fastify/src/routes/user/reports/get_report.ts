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
                      { code: { contains: qTrim, mode: "insensitive" } },
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
                        code: true,
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
    function buildDurations(fromISO: Date, toISO: Date) {
        const ms = Math.max(0, toISO.getTime() - fromISO.getTime());

        const minutes = ms / (60 * 1000);
        const hours = ms / (60 * 60 * 1000);
        const days = ms / (24 * 60 * 60 * 1000);
        const weeks = days / 7;
        // ใช้ค่าเฉลี่ยเชิงปฏิทินเพื่อไม่ต้องดึง lib เพิ่ม:
        const months = days / 30.4375; // ~365.25/12
        const years = days / 365.25;

        // ปัดทศนิยม 2 ตำแหน่งเพื่ออ่านง่าย
        const round2 = (n: number) => Math.round(n * 100) / 100;

        return {
            milliseconds: ms,
            minutes: round2(minutes),
            hours: round2(hours),
            days: round2(days),
            weeks: round2(weeks),
            months: round2(months),
            years: round2(years),
        };
    }

    fastify.get("/user/reports/finished", async (req, reply) => {
        const { device_id, q } = req.query as {
            device_id?: string;
            q?: string;
        };
        const { page = "1", pageSize = "10" } = req.query as {
            page?: string;
            pageSize?: string;
        };
        const ps = Math.min(50, Math.max(1, Number(pageSize) || 10));

        // ฟิลเตอร์จาก device_id
        const deviceFilter: Prisma.ReportWhereInput | undefined =
            device_id && device_id.trim()
                ? { device_id: device_id.trim() }
                : undefined;

        const qTrim = q?.trim();
        const searchFilter: Prisma.ReportWhereInput | undefined = qTrim
            ? {
                  OR: [
                      { detail: { contains: qTrim, mode: "insensitive" } },
                      { code: { contains: qTrim, mode: "insensitive" } },
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

        const finishedFilter: Prisma.ReportWhereInput = {
            histories: { some: { finished: true } },
        };

        const where: Prisma.ReportWhereInput = {
            AND: [finishedFilter, deviceFilter ?? {}, searchFilter ?? {}],
        };

        const [total, rows] = await fastify.prisma.$transaction(
            async (tx: Prisma.TransactionClient) => {
                const total = await tx.report.count({ where });

                const totalPages = Math.ceil(total / ps);
                const rawP = Number(page) || 1;
                const p =
                    totalPages > 0
                        ? Math.min(totalPages, Math.max(1, rawP))
                        : 1;
                const skip = (p - 1) * ps;

                // ดึงเฉพาะ history ที่ finished ล่าสุด 1 รายการ/รายงาน
                const reports = await tx.report.findMany({
                    where,
                    skip,
                    take: ps,
                    orderBy: { created_at: "desc" },
                    select: {
                        id: true,
                        detail: true,
                        img: true,
                        code: true,
                        category: { select: { name: true } },
                        created_at: true,
                        responsible: { select: { display_name: true } },
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
                        histories: {
                            where: { finished: true },
                            orderBy: [
                                // ใช้ finished_at ก่อน ถ้าเท่ากันใช้ changed_at
                                { finished_at: "desc" },
                                { changed_at: "desc" },
                            ],
                            take: 1,
                            select: {
                                id: true,
                                from: true,
                                to: true,
                                note: true,
                                changed_at: true,
                                img_before: true,
                                img_after: true,
                                finished: true,
                                finished_at: true,
                            },
                        },
                    },
                });

                return [total, reports] as const;
            }
        );

        const totalPages = Math.ceil(total / ps);
        const rawP = Number(page) || 1;
        const p = totalPages > 0 ? Math.min(totalPages, Math.max(1, rawP)) : 1;
        type FinishedReport = Prisma.PromiseReturnType<
            typeof fastify.prisma.report.findMany
        >[number];
        const items = rows.map((r: FinishedReport) => {
            const h = r.histories[0];
            const doneAt = h?.finished_at ?? h?.changed_at ?? r.created_at;
            const durations = buildDurations(
                new Date(r.created_at),
                new Date(doneAt)
            );

            return {
                id: r.id,
                detail: r.detail,
                img: r.img,
                code: r.code,
                category: r.category,
                responsible: r.responsible,
                address: r.address,
                created_at: r.created_at,
                finished: true,
                finished_at: doneAt,
                // ส่งระยะเวลาหลายหน่วยตามที่ขอ
                duration: durations,
                // แนบ history ตัวที่ปิดงานเพื่ออ้างอิง
                last_finished_history: h ?? null,
            };
        });

        return reply.send({
            ok: true,
            page: p,
            pageSize: ps,
            total,
            totalPages,
            items,
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
                code: true,
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
