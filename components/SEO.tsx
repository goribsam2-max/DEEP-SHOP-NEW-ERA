import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: any;
  price?: number;
  currency?: string;
  availability?: string; // 'in stock' | 'out of stock'
  canonical?: string;
  noindex?: boolean;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  image = "/favicon.ico", 
  url = typeof window !== 'undefined' ? window.location.href : '', 
  type = "website",
  jsonLd,
  price,
  currency = "BDT",
  availability,
  canonical,
  noindex = false
}) => {
  const fullTitle = `${title} | DEEP SHOP`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {canonical && <link rel="canonical" href={`https://www.deepshop.top${canonical}`} />}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="DEEP SHOP" />

      {price !== undefined && <meta property="product:price:amount" content={price.toString()} />}
      {price !== undefined && <meta property="product:price:currency" content={currency} />}
      {availability && <meta property="product:availability" content={availability} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
