import React, { useEffect, useState } from "react";

import { useLocation } from "@gatsbyjs/reach-router";
import { navigate } from "gatsby";

import { Feed } from "@/components/Feed";
import { Layout } from "@/components/Layout";
import { Page } from "@/components/Page";
import { Sidebar } from "@/components/Sidebar";
import { useSiteMetadata, useTotalSearchList } from "@/hooks";
import { Edge } from "@/types";

import * as styles from "./TotalSearch.module.scss";

const toSearchResultView = (
  keyword: string | undefined,
  items: Edge[],
): React.ReactNode => {
  if (!keyword) {
    return <></>;
  }

  if (items.length === 0) {
    return <span>검색 결과가 없습니다</span>;
  } else {
    return <Feed edges={items} />;
  }
};

interface TotalViewProps {
  title: string;
  description: string;
  keyword: string | undefined;
  setKeyword: (keyword: string) => void;
  resultContent: React.ReactNode;
}

const TotalSearchView = ({
  title,
  description,
  keyword,
  setKeyword,
  resultContent,
}: TotalViewProps) => (
  <Layout title={`Search - ${title}`} description={description}>
    <Sidebar />
    <Page title="전체 검색">
      <div>
        <div className={styles.search}>
          <input
            className={styles.searchKeyword}
            placeholder="검색어를 입력 해주세요"
            name="searchbar"
            onChange={(e) => {
              setKeyword(e.target.value);
            }}
            value={keyword ?? ""}
          />
        </div>
        {resultContent}
      </div>
    </Page>
  </Layout>
);

const useQuery = (key: string): string | undefined => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  return params.get(key) || undefined;
};

const TotalSearch = () => {
  const { title, subtitle: description } = useSiteMetadata();

  const query = useQuery("q") ?? undefined;
  const items: Edge[] = useTotalSearchList(query ?? "");
  const [keyword, setKeyword] = useState<string | undefined>(query);

  useEffect(() => {
    if (keyword) {
      navigate(`/search?q=${encodeURIComponent(keyword)}`, {
        replace: true,
        state: { shouldUpdateScroll: false },
      });
    }
  }, [keyword]);

  return (
    <TotalSearchView
      {...{
        title: title as string,
        description: description as string,
        keyword,
        setKeyword,
        resultContent: toSearchResultView(keyword, items),
      }}
    />
  );
};

export default TotalSearch;
