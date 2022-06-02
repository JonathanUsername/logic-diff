import { NodeWithId } from "./utils";

type TreeNode<TValues> = {
  id: string;
  children: TreeNode<TValues>[];
} & TValues;

export const makeTreeNode = <T extends NodeWithId>(node: T): TreeNode<T> => {
  return {
    ...node,
    children: [],
  };
};
