import Link from "next/link";
import type { Article } from "@/lib/content";

export function dateIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function ArticleList({ articles }: { articles: Article[] }) {
  return (
    <ol className="pa-articles">
      {articles.map((a) => (
        <li className="pa-article" key={a.slug}>
          <time className="pa-meta" dateTime={dateIso(a.date)}>
            {dateIso(a.date)}
          </time>
          <Link href={`/blog/${a.slug}`}>
            <h3 className="pa-h3">{a.titre}</h3>
            <p className="pa-small pa-ex">{a.chapo}</p>
          </Link>
          <span className="pa-meta pa-rt">{a.minutes} min de lecture</span>
        </li>
      ))}
    </ol>
  );
}
