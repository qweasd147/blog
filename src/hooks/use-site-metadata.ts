import { graphql, useStaticQuery } from "gatsby";

const useSiteMetadata = () => {
  const { site } = useStaticQuery(
    graphql`
      query SiteMetaData {
        site {
          siteMetadata {
            author {
              bio
              name
              photo
              contacts {
                rss
                line
                email
                weibo
                gitlab
                medium
                github
                twitter
                codepen
                youtube
                facebook
                linkedin
                telegram
                instagram
                soundcloud
              }
            }
            menu {
              path
              label
            }
            url
            pathPrefix
            title
            subtitle
            copyright
            disqusShortname
            excludeSideBtnPath
          }
        }
      }
    `,
  );

  return site.siteMetadata;
};

export default useSiteMetadata;
