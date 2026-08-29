import type { JsonLdNode } from "@/lib/site/schema";

/**
 * Renders a JSON-LD graph into the document.
 *
 * A server component with no client cost: the JSON is serialised at build time and shipped
 * as inert text in the static export, so it adds nothing to the bundle.
 *
 * `<` is escaped because a `</script>` sequence anywhere inside the data — today only ever
 * from a value we author, but that is not a guarantee worth relying on — would close this
 * element early and spill the rest of the JSON into the page as markup.
 */
export function JsonLd({ schema }: { schema: JsonLdNode }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
