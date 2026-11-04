// Tiny syntax highlighter for JSX/CSS snippets. Wraps tokens in <i class="x-*"> (styled in index.css).
const KEYWORDS = /^(import|from|export|default|function|return|const|let|if|else|for|of|new|await|async|null|undefined|true|false)$/;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlight(code) {
  return code.replace(
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w.]*)|\b([A-Za-z_$][\w$]*)\b|(#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?)|([&<>])/g,
    (m, comment, str, tag, word, num, ch) => {
      if (comment) return `<i class="x-c">${esc(comment)}</i>`;
      if (str) return `<i class="x-s">${esc(str)}</i>`;
      if (tag) return `<i class="x-t">${esc(tag)}</i>`;
      if (word) return KEYWORDS.test(word) ? `<i class="x-k">${word}</i>` : word;
      if (num) return `<i class="x-n">${num}</i>`;
      return esc(ch);
    },
  );
}
