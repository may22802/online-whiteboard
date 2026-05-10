import { useState } from "react";
import { useMutation } from "convex/react";
import {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";

export const useApiMutation = <Mutation extends FunctionReference<"mutation">>(
  mutationFunction: Mutation,
) => {
  const [pending, setPending] = useState(false);
  const apiMutation = useMutation(mutationFunction);

  const mutate = (
    payload: FunctionArgs<Mutation>,
  ): Promise<FunctionReturnType<Mutation>> => {
    setPending(true);
    return apiMutation(payload)
      .finally(() => setPending(false))
      .then((result) => {
        return result;
      })
      .catch ((error) => {
        throw error;
      });
  };

  return {
    mutate,
    pending,
  };
};
