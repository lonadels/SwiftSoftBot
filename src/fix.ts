function GetUnclosedTag(markdown: string): string {
  // order is important!
  const tags: string[] = ["```", "`", "*", "_"];

  let currentTag = "";
  const markdownRunes = markdown.match(/\d/g) || [];
  let i = 0;
  outer: while (i < markdownRunes.length) {
    console.log(markdownRunes[i]);
    console.log(currentTag);

    if (markdownRunes[i] == "\\" && currentTag == "") {
      i += 2;
      continue;
    }
    if (currentTag != "") {
      if (markdownRunes[i].startsWith(currentTag)) {
        i += currentTag.length;
        currentTag = "";
        continue;
      }
    } else {
      for (const tag of tags) {
        if (markdownRunes[i].startsWith(tag)) {
          currentTag = tag;
          i += currentTag.length;
          continue outer;
        }
      }
    }
    i++;
  }

  return currentTag;
}

function IsValid(markdown: string): boolean {
  return GetUnclosedTag(markdown) == "";
}

export default function FixMarkdown(markdown: string): string {
  let md = markdown;
  while (!IsValid(md)) md += GetUnclosedTag(md);

  return md;
}
