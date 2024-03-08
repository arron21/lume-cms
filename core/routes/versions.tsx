import { getPath } from "../utils/path.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";

export default function (app: Hono) {
  app.post("/versions/create", async (c: Context) => {
    const { versioning } = c.get(
      "options",
    ) as CMSContent;

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody();
    const name = body.name as string;
    await versioning.create(name);
    await versioning.change(name);

    return c.redirect(getPath(c));
  });

  app.post("/versions/change", async (c: Context) => {
    const { versioning } = c.get(
      "options",
    ) as CMSContent;

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody();
    const name = body.name as string;
    await versioning.change(name);

    return c.redirect(getPath(c));
  });

  app.post("/versions/publish", async (c: Context) => {
    const { versioning } = c.get(
      "options",
    ) as CMSContent;

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody();
    const name = body.name as string;
    await versioning.publish(name);

    return c.redirect(getPath(c));
  });

  app.post("/versions/delete", async (c: Context) => {
    const { versioning } = c.get(
      "options",
    ) as CMSContent;

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody();
    const name = body.name as string;
    await versioning.delete(name);

    return c.redirect(getPath(c));
  });
}
