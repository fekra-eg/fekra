/** Keep technology names and numeric runs in their natural order inside RTL copy. */
const LTR_RUN = /(\.?[\p{Script=Latin}0-9][\p{Script=Latin}\p{M}0-9.+#%]*(?:[ /&-]+\.?[\p{Script=Latin}0-9][\p{Script=Latin}\p{M}0-9.+#%]*)*)/gu
const ARABIC = /\p{Script=Arabic}/u

/** Same isolation as BidiText, for plain strings (CSS `content`): LRI … PDI is what `<bdi dir="ltr">` does. */
export const bidiIsolate = (text: string) => ARABIC.test(text) ? text.replace(LTR_RUN, '\u2066$1\u2069') : text

export function BidiText({ children }: { children: string | null | undefined }) {
  if (!children) return null
  if (!ARABIC.test(children)) return children
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
