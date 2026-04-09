import { useState, useEffect } from 'react';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { formatUnits } from 'viem';

export function WalletPanel() {
  const { isConnected, address, connector } = useAccount();
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();

  const { data: ethBalance } = useBalance({ address });
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line
  useEffect(() => setMounted(true), []);

  const connected = mounted && isConnected;

  const handleConnect = () => {
    open();
  };

  return (
    <section className="mt-5 p-6 border border-border rounded-[24px] bg-card shadow-sm transition-all hover:border-black/5 dark:hover:border-white/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="font-sans text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1.5">Wallet access</p>
          <h2 className="font-display text-2xl font-bold tracking-tight mb-0 text-foreground">
            {connected ? 'Wallet connected' : 'Connect an Ethereum wallet'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {!connected ? (
            <button 
              onClick={handleConnect}
              className="bg-secondary border border-border text-foreground font-sans font-semibold text-sm rounded-[18px] px-5 py-3 hover:-translate-y-[1px] transition-transform disabled:opacity-50"
            >
              Connect Wallet
            </button>
          ) : (
            <button 
              onClick={() => disconnect()}
              className="bg-secondary border border-border text-foreground font-sans font-semibold text-sm rounded-[18px] px-5 py-3 hover:-translate-y-[1px] transition-transform"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <p className="max-w-[62ch] mt-4 text-muted-foreground leading-relaxed">
        {connected 
          ? `Connected via ${connector?.name || 'Wallet'}. Choose a different address below, refresh available wallets, or disconnect this app session.`
          : 'Connect MetaMask, Rabby, Coinbase Wallet, or another injected Ethereum wallet to attach an address to this monitor.'}
      </p>

      {connected && (
        <div className="flex flex-col md:flex-row justify-between gap-4 mt-5 p-5 border border-border rounded-[20px] bg-gradient-to-b from-muted to-background dark:from-[#1a1f28] dark:to-[#131820]">
          <div>
            <p className="text-[0.82rem] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Connected account</p>
            <h3 className="font-display font-medium text-lg tracking-tight mb-1 text-foreground">Ethereum Account</h3>
            <p className="text-muted-foreground font-mono text-sm break-all">{address}</p>
            
            <div className="flex flex-wrap gap-2.5 mt-3">
              <span className="inline-flex items-center px-2.5 py-1.5 border border-border rounded-full bg-black/5 dark:bg-white/5 text-muted-foreground text-xs font-medium">
                ETH: {ethBalance ? Number(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4) : '--'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1.5 border border-border rounded-full bg-black/5 dark:bg-white/5 text-muted-foreground text-xs font-medium">
                $LAYERTAO: --
              </span>
            </div>
          </div>
          <span className="inline-flex h-fit items-center px-3 py-2 border border-border rounded-full bg-black/5 dark:bg-white/5 text-foreground font-sans text-xs tracking-wider whitespace-nowrap self-start">
            {connector?.name || 'Wallet'}
          </span>
        </div>
      )}
    </section>
  );
}
