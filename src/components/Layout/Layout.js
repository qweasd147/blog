// @flow strict
import React, { useRef } from 'react';
import Helmet from 'react-helmet';
import { withPrefix } from 'gatsby';
import type { Node as ReactNode } from 'react';
import { useSiteMetadata } from '../../hooks';
import SideButton from './SideButton';
import styles from './Layout.module.scss';

type Props = {
  children: ReactNode,
  title: string,
  description?: string,
  socialImage?: string,
};

const Layout = ({ children, title, description, socialImage }: Props) => {
  const { author, url } = useSiteMetadata();
  const metaImage = socialImage != null ? socialImage : author.photo;
  const metaImageUrl = url + withPrefix(metaImage);

  const layoutRef = useRef();
  const observeRef = useRef();

  return (
    <div className={styles.layout} ref={layoutRef}>
      <Helmet>
        <html lang="en" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:site_name" content={title} />
      </Helmet>
      {children}
      <div ref={observeRef} className={styles['layout-doc-mask']} />
      <SideButton
        buttonText="Up"
        docTarget={layoutRef}
        observeTarget={observeRef}
      />
    </div>
  );
};

export default Layout;
