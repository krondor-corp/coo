import commandsRaw from "../../../docs/commands.md?raw";
import developmentRaw from "../../../docs/development.md?raw";
import faqRaw from "../../../docs/faq.md?raw";
import fileFormatRaw from "../../../docs/file-format.md?raw";
import installRaw from "../../../docs/install.md?raw";
import quickstartRaw from "../../../docs/quickstart.md?raw";

export type DocPage = {
  slug: string;
  title: string;
  raw: string;
};

export type DocGroup = {
  title: string;
  pages: DocPage[];
};

const install: DocPage = { slug: "install", title: "Install", raw: installRaw };
const quickstart: DocPage = {
  slug: "quickstart",
  title: "Quickstart",
  raw: quickstartRaw,
};
const commands: DocPage = {
  slug: "commands",
  title: "Commands",
  raw: commandsRaw,
};
const fileFormat: DocPage = {
  slug: "file-format",
  title: "File Format",
  raw: fileFormatRaw,
};
const faq: DocPage = { slug: "faq", title: "FAQ", raw: faqRaw };
const development: DocPage = {
  slug: "development",
  title: "Development",
  raw: developmentRaw,
};

export const DOC_GROUPS: DocGroup[] = [
  { title: "Getting Started", pages: [install, quickstart, commands] },
  { title: "Reference", pages: [fileFormat, faq] },
  { title: "Contributing", pages: [development] },
];

export const DOC_PAGES: DocPage[] = DOC_GROUPS.flatMap((group) => group.pages);

export function findDocPage(slug: string): DocPage | undefined {
  return DOC_PAGES.find((page) => page.slug === slug);
}
