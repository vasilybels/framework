// See https://observablehq.com/framework/config for documentation.
export default {
  // The app’s title; used in the sidebar and webpage titles.
  title: "Vasily Belousov",

  // The pages and sections in the sidebar. If you don’t specify this option,
  // all pages will be listed in alphabetical order. Listing pages explicitly
  // lets you organize them into sections and have unlisted pages.
  // pages: [
  //   {
  //     name: "Examples",
  //     pages: [
  //       {name: "Dashboard", path: "/example-dashboard"},
  //       {name: "Report", path: "/example-report"}
  //     ]
  //   }
  // ],

  // Site-wide stylesheet (must @import observablehq:default.css to keep the theme).
  style: "style.css",

  globalStylesheets: [
    "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap",
    "https://fonts.googleapis.com/css2?family=Monda:wght@400..700&display=swap",
    "https://fonts.googleapis.com/css2?family=Monda:wght@400..700&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap"

  ],

  // The path to the source root.
  root: "src",
  theme: ["cotton", "ink"], // try "light", "dark", "slate", etc.
  // header: "", // what to show in the header (HTML)
  // footer: "Built with Observable.", // what to show in the footer (HTML)
  sidebar: true, // whether to show the sidebar
  toc: true, // whether to show the table of contents
  pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  search: false, // activate search
  linkify: true, // convert URLs in Markdown to links
  typographer: false, // smart quotes and other typographic improvements
  // preserveExtension: false, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs

  pages: [
    {
      name: "Data Visualization",
      path: "/dataviz",
      pages: [
        {name: "Visualizing temporal data from SONYC sensors", path: "/dataviz/sonyc"},
        {name: "Contextualizing U.S. refugee policy in data", path: "/dataviz/refugee-policy"}
      ]
    },
    {
      name: "Journalism and Creative Writing",
      path: "/writing",
      pages: [
        {name: "Advanced Creative Nonfiction Workshop, Spring 2026", path: "/writing/acnf2026"}
      ]
    }
  ]
};
