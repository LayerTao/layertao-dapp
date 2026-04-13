import { useAccount, useReadContract } from "wagmi";
import { ContractABI } from "../context/ContractABI";

const useTokenBalance = (contractAddress: `0x${string}`) => {
  const { address } = useAccount();

  const {
    data: balance,
    isError,
    isFetched,
    refetch,
  } = useReadContract({
    abi: ContractABI,
    address: contractAddress as `0x${string}`,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
        enabled: Boolean(contractAddress) && Boolean(address),
    }
  });

  const { data: decimals } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ContractABI,
    functionName: "decimals",
    query: {
        enabled: Boolean(contractAddress),
    }
  });

  return { balance, isError, isFetched, decimals, refetch };
};

export default useTokenBalance;
