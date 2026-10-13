import { contextQuestions } from './context.mjs';
import { readingQuestions } from './reading.mjs';
import { clozeQuestions } from './cloze.mjs';
export const freshCatalog = [...contextQuestions, ...readingQuestions, ...clozeQuestions];
export const freshMetadata = {
  version:'authored-v1', finite:true, runtimeAI:false,
  moduleCount:3, conceptCount:12, questionCount:72,
  descriptionZh:'72道离线原创补充题：语境选词、阅读、完形各24道；每个能力标签6道。阅读与完形各题使用独立短文。',
  exhaustionZh:'此能力点的未见新题已用完。旧题不会自动冒充新题；可选择其他能力点，或明确进入旧题复习。',
  limitationsZh:['这是有限的人工编写题集，不是无限实时AI生成。','不同随机种子只改变选题顺序与选项位置，不增加独立题目数量。','测试覆盖结构、精确证据与不重复逻辑；内容经过编辑检查，未经独立教师实测。','覆盖12个模块内能力点，不是289个词逐词全覆盖。']
};
