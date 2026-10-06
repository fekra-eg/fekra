/** Keep technology names and numeric runs in their natural order inside RTL copy. */
const LTR_RUN = /(\.?[A-Za-z0-9][A-Za-z0-9.+#%]*(?:[ /&-]+\.?[A-Za-z0-9][A-Za-z0-9.+#%]*)*)/g

/** Same isolation as BidiText, for plain strings (CSS `content`): LRI … PDI is what `<bdi dir="ltr">` does. */
export const bidiIsolate = (text: string) => text.replace(LTR_RUN, '\u2066$1\u2069')

export function BidiText({ children }: { children: string | null | undefined }) {
  if (!children) return null
  return children
    .split(LTR_RUN)
    .map((part, index) =>
      index % 2 ? (
        <bdi key={index} dir="ltr">
          {part}
        </bdi>
      ) : (
        part
      ),
    )
}
