import { useMemo } from "react";

import { graphql, useStaticQuery } from "gatsby";

import { Edge } from "@/types";

interface TotalSearchItems {
  Props: {
    keyword: string;
    replaceKeyword?: boolean;
  };
  TagsQueryResult: {
    allMarkdownRemark: {
      group: Array<{
        fieldValue: string;
        totalCount: number;
      }>;
    };
  };
  UseContentItems: {
    allMarkdownRemark: {
      edges: Array<Edge>;
    };
    replaceAllMarkdownRemark: Array<{
      node: {
        html: string;
      };
    }>;
  };
  TotalSearchListQueryResult: {
    allMarkdownRemark: {
      edges: Array<Edge>;
    };
  };
}

const useBlogContents = (): [TotalSearchItems["UseContentItems"]] => {
  const { allMarkdownRemark } = useStaticQuery<
    TotalSearchItems["TotalSearchListQueryResult"]
  >(
    graphql`
      query TotalSearchListQuery {
        allMarkdownRemark(
          filter: {
            frontmatter: { template: { eq: "post" }, draft: { ne: true } }
          }
        ) {
          edges {
            node {
              fields {
                slug
                __typename
                categorySlug
              }
              frontmatter {
                template
                title
                date
                tags
                socialImage
                draft
                description
                category
              }
              id
              html
            }
          }
        }
      }
    `,
  );

  const replaceAllMarkdownRemark = useMemo(
    function () {
      return allMarkdownRemark.edges.map(function (edge: Edge) {
        const html = edge.node.html
          .replace(/(<([^>]+)>)/gi, "")
          .replace(/\n+/g, " ");

        return {
          node: {
            // ...edge.node,
            html,
          },
        };
      });
    },
    [allMarkdownRemark],
  );

  return [
    {
      allMarkdownRemark,
      replaceAllMarkdownRemark,
    },
  ];
};

const searchTotalPosts = ({
  keyword,
  replaceKeyword = true,
}: TotalSearchItems["Props"]): Edge[] => {
  let searchKeyword: string;
  if (replaceKeyword) {
    searchKeyword = keyword.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  } else {
    searchKeyword = keyword;
  }

  searchKeyword = searchKeyword.toLowerCase();

  const [{ allMarkdownRemark, replaceAllMarkdownRemark }] = useBlogContents();

  const searchResult = useMemo(
    () =>
      allMarkdownRemark.edges.filter(
        (edge, idx) =>
          edge.node.frontmatter.category
            .toLowerCase()
            .includes(searchKeyword) ||
          edge.node.frontmatter.title.toLowerCase().includes(searchKeyword) ||
          edge.node.frontmatter.description
            ?.toLowerCase()
            ?.includes(searchKeyword) ||
          edge.node.frontmatter.tags?.some((tag) =>
            tag.toLowerCase().includes(searchKeyword),
          ) ||
          replaceAllMarkdownRemark[idx].node.html.includes(searchKeyword),
      ) ?? [],
    [searchKeyword],
  );

  return searchResult;
};

const useTotalSearchList = (keyword: string): Edge[] =>
  searchTotalPosts({ keyword });

export default useTotalSearchList;
