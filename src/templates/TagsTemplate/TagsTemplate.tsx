import React from "react";

import { Layout } from "@/components/Layout";
import { Page } from "@/components/Page";
import { Sidebar } from "@/components/Sidebar";
import Tag from "@/components/Tags";
import { useSiteMetadata, useTagsList } from "@/hooks";
import { toKebabCase } from "@/utils";

const TagsTemplate: React.FC = () => {
  const { title, subtitle } = useSiteMetadata();
  const tags = useTagsList();

  return (
    <Layout title={`Tags - ${title}`} description={subtitle}>
      <Sidebar />
      <Page title="Tags">
        <Tag.TagBox>
          {tags
            .sort((tag1, tag2) => tag2.totalCount - tag1.totalCount)
            .map(({ fieldValue, totalCount }) => (
              <Tag.TagItem
                {...{
                  to: `/tag/${toKebabCase(fieldValue)}/`,
                  name: fieldValue,
                  count: totalCount,
                  key: toKebabCase(fieldValue),
                }}
              />
            ))}
        </Tag.TagBox>
      </Page>
    </Layout>
  );
};

export default TagsTemplate;
