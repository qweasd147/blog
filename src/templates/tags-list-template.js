// @flow strict
import React from 'react';
import kebabCase from 'lodash/kebabCase';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Page from '../components/Page';
import Tag from '../components/Tag';
import { useSiteMetadata, useTagsList } from '../hooks';

const TagsListTemplate = () => {
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
                  to: `/tag/${kebabCase(fieldValue)}/`,
                  name: fieldValue,
                  count: totalCount,
                  key: kebabCase(fieldValue),
                }}
              />
            ))}
        </Tag.TagBox>
      </Page>
    </Layout>
  );
};

export default TagsListTemplate;
