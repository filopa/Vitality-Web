export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so the JSON can never close the script tag
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
