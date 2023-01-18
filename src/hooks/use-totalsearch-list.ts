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

interface UseContentItems {
  allMarkdownRemark: {
    edges: Array<Edge>;
  };
  replaceAllMarkdownRemark: {
    node: {
      html: string;
    };
  }[];
}

const useBlogContents = (): [UseContentItems] => {
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

  const replacedEdges = useMemo(
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
      allMarkdownRemark: allMarkdownRemark,
      replaceAllMarkdownRemark: replacedEdges,
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

  const [
    {
      allMarkdownRemark: originContents,
      replaceAllMarkdownRemark: replaceContents,
    },
  ] = useBlogContents();

  const searchResult = useMemo(
    () =>
      originContents.edges.filter(
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
          replaceContents[idx].node.html.includes(searchKeyword),
      ) ?? [],
    [searchKeyword],
  );

  return searchResult;
};

const useTotalSearchList = (keyword: string): Edge[] =>
  searchTotalPosts({ keyword });

export default useTotalSearchList;
