import { useMemo } from "react";

import { graphql, useStaticQuery } from "gatsby";

import { Edge } from "@/types";

interface TotalSearchListQueryResult {
  allMarkdownRemark: {
    edges: Array<Edge>;
  };
}

interface TotalSearchItems {
  Props: {
    keyword: string;
    replaceKeyword?: boolean;
  };

  items: {
    title: string;
    description: string;
    tags: string[];
    category: string;
    date: Date;
  }[];

  TagsQueryResult: {
    allMarkdownRemark: {
      group: Array<{
        fieldValue: string;
        totalCount: number;
      }>;
    };
  };
}

const searchTotalPosts = ({
  keyword,
  replaceKeyword = true,
}: TotalSearchItems["Props"]): Edge[] => {
  if (keyword.length === 0) return [];

  let searchKeyword: string;
  if (replaceKeyword) {
    searchKeyword = keyword.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  } else {
    searchKeyword = keyword;
  }

  searchKeyword = searchKeyword.toLowerCase();

  const { allMarkdownRemark } = useStaticQuery<TotalSearchListQueryResult>(
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

  const copiedEdges = allMarkdownRemark.edges.map(function (edge: Edge) {
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

  console.log(`call use total search list ${searchKeyword}`);

  const edges =
    allMarkdownRemark.edges.filter(
      (edge, idx) =>
        edge.node.frontmatter.category.toLowerCase().includes(searchKeyword) ||
        edge.node.frontmatter.title.toLowerCase().includes(searchKeyword) ||
        edge.node.frontmatter.description
          ?.toLowerCase()
          ?.includes(searchKeyword) ||
        edge.node.frontmatter.tags?.some((tag) =>
          tag.toLowerCase().includes(searchKeyword),
        ) ||
        copiedEdges[idx].node.html.includes(searchKeyword),
    ) ?? [];

  return edges;
};

/*
 * const useTotalSearchList = (keyword: string): Edge[] =>
 *   searchTotalPosts({ keyword });
 */

const useTotalSearchList = (keyword: string): Edge[] =>
  useMemo(() => searchTotalPosts({ keyword }), [keyword]);

export default useTotalSearchList;
