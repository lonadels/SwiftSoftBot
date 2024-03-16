function GetUnclosedTag(markdown: string): string {
  // order is important!
  const tags: string[] = ["```", "`", "*", "_"];

  let currentTag = "";
  const markdownRunes = markdown.split("");

  outer: for (let i = 0; i < markdownRunes.length; i++) {
    // skip escaped characters (only outside tags)
    if (markdownRunes[i] == "\\" && currentTag == "") {
      i += 2;
      continue;
    }
    if (currentTag != "") {
      if (markdownRunes[i].startsWith(currentTag)) {
        // turn a tag off
        i += currentTag.length;
        currentTag = "";
        continue;
      }
    } else {
      for (const tag of tags) {
        if (markdownRunes[i].startsWith(tag)) {
          // turn a tag on
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
  const tag = GetUnclosedTag(markdown);
  if (tag == "") {
    return markdown;
  }
  return markdown + tag;
}
