import React, { useMemo, useRef } from "react";
import Helmet from "react-helmet";

import { useLocation } from "@gatsbyjs/reach-router";

import { useSiteMetadata } from "@/hooks";

import SideButton from "./SideButton";

import * as styles from "./Layout.module.scss";

interface Props {
  title: string;
  description?: string;
  socialImage?: string;

  children: React.ReactNode;
}

// 추가로 시작페이지('/')도 숨긴다.
const hideSideButtnUrl: Array<string> = ["/category", "/tag", "/page"];

const Layout: React.FC<Props> = ({
  children,
  title,
  description,
  socialImage = "",
}: Props) => {
  const { author, url, pathPrefix } = useSiteMetadata();
  const metaImage = socialImage || author.photo;
  const metaImageUrl = url + metaImage;

  const layoutRef = useRef<HTMLDivElement>(null);
  const observeRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isHideSideButton = useMemo(
    function () {
      if (
        location.pathname === "/" ||
        location.pathname === pathPrefix ||
        location.pathname === pathPrefix + "/"
      ) {
        return true;
      }

      return hideSideButtnUrl.some(function (hideUrl) {
        return (
          location.pathname.startsWith(hideUrl) ||
          location.pathname.startsWith(pathPrefix + hideUrl)
        );
      });
    },
    [location.pathname],
  );

  return (
    <div className={styles.layout} ref={layoutRef}>
      <Helmet>
        <html lang="en" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:site_name" content={title} />
        <meta property="og:image" content={metaImageUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={metaImageUrl} />
      </Helmet>
      {children}
      <div ref={observeRef} className={styles.layoutDocMask} />
      {!isHideSideButton && (
        <SideButton
          buttonText="Up"
          docTarget={layoutRef}
          observeTarget={observeRef}
        />
      )}
    </div>
  );
};

export default Layout;
