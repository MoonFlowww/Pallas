/**
 * A utility function to conditionally apply classNames.
 *
 * @param classes - An array of classNames to apply.
 * @returns A string of concatenated classNames.
 */
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ")
}

