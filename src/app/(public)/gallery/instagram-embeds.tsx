"use client";

import { useEffect, useRef } from "react";

type InstagramEmbedProps = {
  posts: { id: string; post_url: string; caption: string | null }[];
};

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

export function InstagramEmbeds({ posts }: InstagramEmbedProps) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (posts.length === 0) return;

    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }

    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => {
      window.instgrm?.Embeds.process();
    };
    document.body.appendChild(script);
  }, [posts]);

  if (posts.length === 0) return null;

  return (
    <div className="gallery-event">
      <div className="gallery-event__hdr">
        <span className="ge-emoji" style={{ marginRight: 6 }}>
          📸
        </span>
        Instagramから
      </div>
      <div className="ig-grid">
        {posts.map((post) => (
          <div key={post.id} className="ig-embed-wrap">
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={post.post_url}
              data-instgrm-version="14"
              style={{
                background: "#FFF",
                border: 0,
                borderRadius: "12px",
                boxShadow: "0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)",
                margin: "0",
                maxWidth: "300px",
                minWidth: "200px",
                padding: 0,
                width: "100%",
              }}
            >
              <a
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cr-blue"
              >
                Instagramで見る
              </a>
            </blockquote>
            {post.caption && <p className="ig-embed-caption">{post.caption}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
