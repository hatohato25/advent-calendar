"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

interface PostContentProps {
  content: string;
}

/**
 * Markdown記事コンテンツ表示コンポーネント
 * - react-markdownでMarkdownをレンダリング
 * - remark-gfmでGitHub Flavored Markdown対応（テーブル、タスクリストなど）
 * - rehype-rawでMarkdown内のHTMLタグをパース（画像サイズ指定などに使用）
 * - rehype-sanitizeでXSS対策（img要素とwidth, height, style, className属性を許可）
 * - rehype-highlightでシンタックスハイライト
 */
export function PostContent({ content }: PostContentProps) {
  // rehype-sanitizeの設定をカスタマイズして、HTMLタグと画像のサイズ指定属性を許可
  // Markdown内で <img src="..." width="80%" /> のようなHTMLタグを安全に使用できるようにする
  const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [
      ...(defaultSchema.tagNames || []),
      "img", // img タグを明示的に許可
    ],
    attributes: {
      ...defaultSchema.attributes,
      img: ["src", "alt", "title", "width", "height", "style", "className", "class"],
    },
  };

  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw, // 1. HTMLを解析
          [rehypeSanitize, sanitizeSchema], // 2. サニタイズ
          rehypeHighlight, // 3. ハイライト
        ]}
        components={{
          // カスタムコンポーネントで見た目を調整
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold tracking-tight lg:text-3xl mt-8 mb-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold tracking-tight lg:text-2xl mt-6 mb-3">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4 leading-7">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 ml-6 list-disc [&>li]:mt-2">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal [&>li]:mt-2">{children}</ol>,
          li: ({ children }) => <li className="leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-6 border-l-2 pl-6 italic [&>*]:mb-4">{children}</blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                  {children}
                </code>
              );
            }
            return <code className={className}>{children}</code>;
          },
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-lg border bg-muted p-4">{children}</pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium underline underline-offset-4 hover:text-primary"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-6 w-full overflow-y-auto">
              <table className="w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
              {children}
            </td>
          ),
          img: ({ src, alt, width, height, style, className }) => {
            if (!src || typeof src !== "string") return null;

            // HTMLタグで直接指定された属性を使用
            // <img src="..." width="80%" /> のような形式をサポート
            const imgWidth = width;
            const imgHeight = height;
            const imgStyle = style as React.CSSProperties | undefined;
            const imgClassName = className || "rounded-lg border shadow-sm";

            // 外部画像の場合は通常のimgタグを使用
            if (src.startsWith("http://") || src.startsWith("https://")) {
              return (
                <span className="block my-6">
                  {/* biome-ignore lint/performance/noImgElement: 外部画像はNext.js Imageで最適化できないためimgタグを使用 */}
                  <img
                    src={src}
                    alt={alt || ""}
                    width={imgWidth}
                    height={imgHeight}
                    style={imgStyle}
                    className={imgClassName}
                  />
                </span>
              );
            }

            // ローカル画像でサイズ指定がある場合はimgタグで表示
            // HTMLタグで指定された属性をそのまま保持
            const hasSize = imgWidth || imgHeight || imgStyle;

            if (hasSize) {
              return (
                <span className="block my-6">
                  {/* biome-ignore lint/performance/noImgElement: サイズ指定された画像はimgタグで表示（HTMLタグの属性を保持） */}
                  <img
                    src={src}
                    alt={alt || ""}
                    width={imgWidth}
                    height={imgHeight}
                    style={imgStyle}
                    className={imgClassName}
                  />
                </span>
              );
            }

            // サイズ指定がない場合はNext.js Imageで最適化
            return (
              <span className="block my-6 relative w-full" style={{ aspectRatio: "16 / 9" }}>
                <Image
                  src={src}
                  alt={alt || ""}
                  fill
                  className="rounded-lg border shadow-sm object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
              </span>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
