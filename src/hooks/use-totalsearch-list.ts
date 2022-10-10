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

const searchTotalPosts = ({ keyword }: TotalSearchItems["Props"]): Edge[] => {
  if (keyword.length === 0) return [];

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

  const lowerKeyword = keyword.toLowerCase();

  const edges =
    allMarkdownRemark?.edges?.filter(
      (edge) =>
        edge.node.frontmatter.category.toLowerCase().includes(lowerKeyword) ||
        edge.node.frontmatter.title.toLowerCase().includes(lowerKeyword) ||
        edge.node.frontmatter.description
          ?.toLowerCase()
          ?.includes(lowerKeyword) ||
        edge.node.frontmatter.tags?.some((tag) =>
          tag.toLowerCase().includes(lowerKeyword),
        ),
    ) ?? [];

  return edges;
};

const useTotalSearchList = (keyword: string): Edge[] =>
  searchTotalPosts({ keyword });

// useMemo(() => searchTotalPosts({ keyword }), [keyword]);

export default useTotalSearchList;
