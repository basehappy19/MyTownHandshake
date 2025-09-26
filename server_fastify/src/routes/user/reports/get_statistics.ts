import type { FastifyPluginAsync } from "fastify";

interface StatusRow {
    id: number;
    code: string;
    label: string;
    sort_order: number;
    is_active: boolean;
    count: bigint;
    gradient: string | null;
    badge_ring: string | null;
    badge_bg: string | null;
    icon: string | null;
    text_color: string | null;
}

interface Item {
    id: number;
    code: string;
    label: string;
    count: number;
    percent: number;
    gradient: string | null;
    badge_ring: string | null;
    badge_bg: string | null;
    icon: string | null;
    text_color: string | null;
}

const getStatisticsStatuses: FastifyPluginAsync = async (fastify) => {
    fastify.get("/statistic/statuses", async (_req, res) => {
        const rows = await fastify.prisma.$queryRaw<StatusRow[]>`
      WITH latest AS (
        SELECT DISTINCT ON (rsh.report_id)
               rsh.report_id,
               rsh.to_status
        FROM "report_status_history" rsh
        ORDER BY rsh.report_id, rsh.changed_at DESC, rsh.id DESC
      ),
      counts AS (
        SELECT s.id,
               s.code,
               s.label,
               s.sort_order,
               s.is_active,
               s.gradient,
               s.badge_ring,
               s.badge_bg,
               s.icon,
               s.text_color,
               COALESCE(c.cnt, 0)::bigint AS count
        FROM "statuses" s
        LEFT JOIN (
          SELECT to_status AS status_id, COUNT(*)::bigint AS cnt
          FROM latest
          GROUP BY to_status
        ) c ON c.status_id = s.id
      )
      SELECT id, code, label, sort_order, is_active,
             gradient, badge_ring, badge_bg, icon, text_color,
             count
      FROM counts
      ORDER BY sort_order, id
    `;

        // ใส่ชนิดให้ r ใน map
        const plain = rows.map((r: StatusRow) => ({
            id: r.id,
            code: r.code,
            label: r.label,
            sort_order: r.sort_order,
            is_active: r.is_active,
            count: Number(r.count),
            gradient: r.gradient,
            badge_ring: r.badge_ring,
            badge_bg: r.badge_bg,
            icon: r.icon,
            text_color: r.text_color,
        }));

        // ใส่ชนิดให้ acc และ r ใน reduce
        const total: number = plain.reduce(
            (acc: number, r: (typeof plain)[number]) => acc + r.count,
            0
        );

        // ใส่ชนิดให้ r ใน map
        const items: Item[] = plain.map((r: (typeof plain)[number]) => {
            const percent = total > 0 ? Math.round((r.count / total) * 100) : 0;
            return {
                id: r.id,
                code: r.code,
                label: r.label,
                count: r.count,
                percent,
                gradient: r.gradient,
                badge_ring: r.badge_ring,
                badge_bg: r.badge_bg,
                icon: r.icon,
                text_color: r.text_color,
            };
        });

        const summary: Item = {
            id: -1,
            code: "ALL",
            label: "ทั้งหมด",
            count: total,
            percent: total > 0 ? 100 : 0,
            gradient: null,
            badge_ring: null,
            badge_bg: null,
            icon: null,
            text_color: null,
        };

        return res.send({
            ok: true,
            total,
            items,
            summary,
        });
    });
};

export { getStatisticsStatuses };
