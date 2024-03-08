import uploadsList from "../templates/uploads/list.ts";
import uploadsView from "../templates/uploads/view.ts";
import { slugify } from "../utils/string.ts";
import { getPath, normalizePath } from "../utils/path.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";

export default function (app: Hono) {
  app.get("/uploads/:upload", async (c: Context) => {
    const { uploads, versioning } = c.get("options") as CMSContent;
    const uploadId = c.req.param("upload");

    if (!uploads[uploadId]) {
      return c.notFound();
    }

    const upload = uploads[uploadId];

    return c.render(
      uploadsList({
        context: c,
        upload,
        version: await versioning?.current(),
      }),
    );
  });

  app.post("/uploads/:upload/create", async (c: Context) => {
    const { uploads } = c.get("options") as CMSContent;
    const uploadId = c.req.param("upload");
    const { storage } = uploads[uploadId];
    const body = await c.req.parseBody();
    const file = body.file as File;
    const fileId = slugify(file.name);
    const entry = storage.get(fileId);

    await entry.writeFile(file);
    return c.redirect(getPath(c, "uploads", uploadId, "file", fileId));
  });

  app.get("/uploads/:upload/raw/:file", async (c: Context) => {
    const { uploads } = c.get("options") as CMSContent;
    const uploadId = c.req.param("upload");
    const fileId = c.req.param("file");

    if (!uploads[uploadId]) {
      return c.notFound();
    }

    const { storage } = uploads[uploadId];
    const entry = storage.get(fileId);

    const file = await entry.readFile();
    c.header("Content-Type", file.type);
    c.header("Content-Length", file.size.toString());
    return c.body(new Uint8Array(await file.arrayBuffer()));
  });

  app.get("/uploads/:upload/file/:file", async (c: Context) => {
    const { uploads, versioning } = c.get("options") as CMSContent;
    const uploadId = c.req.param("upload");
    const fileId = c.req.param("file");
    const { storage, publicPath } = uploads[uploadId];

    if (!uploads[uploadId]) {
      return c.notFound();
    }

    try {
      const entry = storage.get(fileId);
      const file = await entry.readFile();

      return c.render(
        uploadsView({
          context: c,
          type: file.type,
          size: file.size,
          collection: uploadId,
          publicPath: normalizePath(publicPath, fileId),
          file: fileId,
          version: await versioning?.current(),
        }),
      );
    } catch {
      return c.notFound();
    }
  })
    .post(async (c: Context) => {
      const { uploads } = c.get("options") as CMSContent;
      const uploadId = c.req.param("upload");
      const { storage } = uploads[uploadId];
      const body = await c.req.parseBody();
      const prevId = c.req.param("file");
      const fileId = body._id as string;

      if (prevId !== fileId) {
        await storage.rename(prevId, fileId);
      }

      const file = body.file as File | undefined;

      if (file) {
        const entry = storage.get(fileId);
        await entry.writeFile(file);
      }

      return c.redirect(getPath(c, "uploads", uploadId, "file", fileId));
    });

  app.post("/uploads/:upload/delete/:file", async (c: Context) => {
    const { uploads } = c.get("options") as CMSContent;
    const uploadId = c.req.param("upload");
    const fileId = c.req.param("file");
    const { storage } = uploads[uploadId];

    await storage.delete(fileId);
    return c.redirect(getPath(c, "uploads", uploadId));
  });
}
