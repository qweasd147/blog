// @flow strict
import React from 'react';
import Layout from '../components/Layout';
import Skills from '../components/Custompage';
import { useSiteMetadata } from '../hooks';

const SkillsTemplate = () => {
  const { title, subtitle } = useSiteMetadata();

  return (
    <Layout title={`Skills - ${title}`} description={subtitle}>
      <Skills />
    </Layout>
  );
};

export default SkillsTemplate;
