/**
 * The BCP-47 tag to declare for content in `locale` (`lang` attributes, speech synthesis). Internal codes stay
 * short (`pt` in storage, URLs, catalogues, file names), but our Portuguese is Brazilian, so it is declared as
 * `pt-BR`: screen readers and speech synthesis then pick a Brazilian voice. Every other tag is returned unchanged
 * (`zh-Hans` stays `zh-Hans`; an explicit `pt-PT` stays `pt-PT`).
 */
export function bcp47Tag(locale: string): string {
  return locale.toLowerCase() === 'pt' ? 'pt-BR' : locale;
}
