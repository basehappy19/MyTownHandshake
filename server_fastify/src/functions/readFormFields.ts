import type { FastifyRequest } from "fastify";

export async function getFields(req: FastifyRequest) {
    if (
        typeof (req as any).isMultipart === "function" &&
        (req as any).isMultipart()
    ) {
        const parts = (req as any).parts();
        const fields: Record<string, string> = {};
        for await (const part of parts) {
            if (part.type === "file") {
                part.file.resume();
                await new Promise((res) => {
                    part.file.on("end", res);
                    part.file.on("error", res);
                });
                continue;
            }
            fields[part.fieldname] =
                typeof part.value === "string"
                    ? part.value
                    : String(part.value ?? "");
        }
        return fields;
    }

    const b = (req.body ?? {}) as any;
    return b;
}
