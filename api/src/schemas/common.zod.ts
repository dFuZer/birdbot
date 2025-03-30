import { z } from "zod";

let numericString = z.string().regex(/^\d+$/).transform(Number);

export { numericString };
