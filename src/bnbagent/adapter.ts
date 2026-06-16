import { hashInputs } from "../receipt/hash.js";
import type { ClearTradeStrategySpec } from "../schema/strategy.js";
import type { TradeIntentSchema } from "../schema/receipt.js";
import type { z } from "zod";

type TradeIntent = z.infer<typeof TradeIntentSchema>;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export interface BnbAgentSdkPlan {
  sdk: {
    package: "bnbagent";
    language: "python";
    docs: string;
  };
  mode: "dry_run";
  capabilities: Array<"erc8004_agent_identity" | "erc8183_agentic_commerce">;
  registrationFile: {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";
    name: string;
    description: string;
    image: "";
    services: Array<{
      name: "ERC-8183";
      endpoint: string;
      version: string;
    }>;
    registrations: [];
    supportedTrust: string[];
  };
  jobDescription: {
    version: 1;
    negotiated_at: number;
    task: string;
    terms: {
      deliverables: string[];
      quality_standards: string[];
      success_criteria: string[];
    };
    price: "0";
    currency: typeof ZERO_ADDRESS;
  };
  deliverableManifest: {
    version: 1;
    job_id: 0;
    chain_id: 97;
    contracts: {
      commerce: typeof ZERO_ADDRESS;
      router: typeof ZERO_ADDRESS;
      policy: typeof ZERO_ADDRESS;
    };
    response: {
      content: string;
      content_type: "application/json";
    };
    metadata: {
      strategyId: string;
      mode: "paper";
      tradeHash: string;
    };
  };
  safetyBoundary: {
    wallet: "not_loaded";
    networkCalls: "disabled";
    onChainSubmit: "disabled";
  };
}

export function buildBnbAgentSdkPlan(params: {
  strategy: ClearTradeStrategySpec;
  tradeIntent: TradeIntent;
  now: number;
}): BnbAgentSdkPlan {
  const tradeHash = hashInputs(params.tradeIntent);
  return {
    sdk: {
      package: "bnbagent",
      language: "python",
      docs: "https://docs.bnbchain.org/developer-kit/bnbagent-sdk/",
    },
    mode: "dry_run",
    capabilities: ["erc8004_agent_identity", "erc8183_agentic_commerce"],
    registrationFile: {
      type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
      name: "ClearTrade Agent",
      description:
        "Paper-only BNB Hack trading strategy agent with receipt-backed risk gates.",
      image: "",
      services: [
        {
          name: "ERC-8183",
          endpoint: "local-only://cleartrade-agent/erc8183/status",
          version: "0.1.0",
        },
      ],
      registrations: [],
      supportedTrust: ["erc8004", "erc8183"],
    },
    jobDescription: {
      version: 1,
      negotiated_at: params.now,
      task: `Evaluate ${params.strategy.strategyId} trade intent and produce sealed paper-trade receipts.`,
      terms: {
        deliverables: [
          "strategy packet",
          "signal receipt",
          "risk receipt",
          "execution dry-run receipt",
        ],
        quality_standards: [
          "no wallet signing",
          "no network submission",
          "all receipts hash-verifiable",
        ],
        success_criteria: [
          "risk governor returns a deterministic verdict",
          "execution intent is not submitted on-chain in Track 2 mode",
        ],
      },
      price: "0",
      currency: ZERO_ADDRESS,
    },
    deliverableManifest: {
      version: 1,
      job_id: 0,
      chain_id: 97,
      contracts: {
        commerce: ZERO_ADDRESS,
        router: ZERO_ADDRESS,
        policy: ZERO_ADDRESS,
      },
      response: {
        content: JSON.stringify(
          {
            strategyId: params.strategy.strategyId,
            objective: params.strategy.objective,
            tradeIntent: params.tradeIntent,
            tradeHash,
          },
          null,
          2,
        ),
        content_type: "application/json",
      },
      metadata: {
        strategyId: params.strategy.strategyId,
        mode: "paper",
        tradeHash,
      },
    },
    safetyBoundary: {
      wallet: "not_loaded",
      networkCalls: "disabled",
      onChainSubmit: "disabled",
    },
  };
}
