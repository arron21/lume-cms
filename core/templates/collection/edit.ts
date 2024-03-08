import { escape } from "../../../deps/std.ts";
import { getPath } from "../../utils/path.ts";
import { prepareField } from "../../utils/data.ts";
import breadcrumb from "../breadcrumb.ts";

import type Collection from "../../collection.ts";
import type Document from "../../document.ts";
import type { Version } from "../../../types.ts";
import { Context } from "../../../deps/hono.ts";

interface Props {
  context: Context;
  collection: Collection;
  document: Document;
  version?: Version;
}

export default async function template(
  { context, collection, document, version }: Props,
) {
  const data = await document.read();
  const fields = await Promise.all(document.fields.map(async (field) => `
  <${field.tag}
    data-nameprefix="changes"
    data-value="${escape(JSON.stringify(data[field.name] ?? null))}"
    data-field="${escape(JSON.stringify(await prepareField(field)))}"
  >
  </${field.tag}>
`));

  return `
${
    breadcrumb(context, version, [
      collection.name,
      getPath(context, "collection", collection.name),
    ], "Editing file")
  }

<u-form>
  <header class="header">
    <h1 class="header-title">
      Editing file
      <input
        class="input is-inline"
        id="_id"
        type="text"
        name="_id"
        value="${document.name}"
        placeholder="Rename the file…"
        form="form-edit"
        aria-label="File name"
        required
      >
    </h1>
  </header>
  <form
    action="${
    getPath(context, "collection", collection.name, "edit", document.name)
  }"
    method="post"
    class="form"
    enctype="multipart/form-data"
    id="form-edit"
  >
    ${fields.join("")}

    <footer class="footer ly-rowStack is-responsive">
      <button class="button is-primary" type="submit">
        <u-icon name="check"></u-icon>
        Save changes
      </button>
      <u-confirm data-message="Are you sure?">
        <button
          class="button is-secondary"
          type="submit"
          formAction="${
    getPath(
      context,
      "collection",
      collection.name,
      "delete",
      document.name,
    )
  }"
        >
          <u-icon name="trash"></u-icon>
          Delete
        </button>
      </u-confirm>
      <u-pagepreview class="ly-rowStack" data-src="${document.src}"></u-pagepreview>
    </footer>
  </form>
</u-form>
  `;
}
