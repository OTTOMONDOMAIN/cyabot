import React, { useState, useEffect } from 'react';
import { useStatus } from '../hooks/useData';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

const MASTER_DISCORD_ID = '1364577822844387432';

interface AuthorizedDiscordUser {
  id: string;
  username: string;
  avatarUrl: string;
  isMasterAdmin: boolean;
  roleLabel: string;
}

export interface GuildConfig {
  guildId: string;
  guildName: string;
  memberCount: number;
  iconUrl: string;
  botPresent?: boolean;
  planTier: 'basic' | 'starter' | 'premium';
  prefix: string;
  noPrefixMode: boolean;
  noPrefixUsers: string[];
  earlyAccessCommands: boolean;
  aiCommandsEnabled: boolean;
  antinuke: {
    enabled: boolean;
    punishment: 'ban' | 'kick' | 'strip_roles';
    antiChannelDelete: boolean;
    antiRoleDelete: boolean;
    antiMassBan: boolean;
    antiWebhook: boolean;
    antiBotAdd: boolean;
    whitelistedUsers: string[];
  };
  automod: {
    antiLinks: boolean;
    antiInvites: boolean;
    antiPhishing: boolean;
    antiSpam: boolean;
    logChannel: string;
  };
  music: {
    mode247: boolean;
    defaultVolume: number;
    audioFilter: 'none' | 'bassboost' | '8d' | 'nightcore';
    djRole: string;
  };
  voicemaster: {
    enabled: boolean;
    categoryName: string;
    hubChannelName: string;
    defaultBitrate: number;
  };
  customProfile: {
    nickname: string;
    avatarUrl: string;
    bannerUrl: string;
    bio: string;
  };
  savedEmbeds: Array<{
    id: string;
    name: string;
    channelName: string;
    title: string;
    description: string;
    color: string;
    footer: string;
  }>;
  updatedAt: string;
}

interface GiveawayItem {
  id: string;
  prize: string;
  winners: number;
  channel: string;
  duration: string;
  endsAt: string;
  active: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { status } = useStatus(5000);

  // Authorized Discord User State (Populated via Discord OAuth2)
  const [currentUser, setCurrentUser] = useState<AuthorizedDiscordUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('cya_dashboard_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Control Room Navigation State ('security' replaced with 'admindash')
  const [navSection, setNavSection] = useState<'overview' | 'servers' | 'admindash' | 'giveaways'>('overview');
  const [guilds, setGuilds] = useState<GuildConfig[]>([]);
  const [allBotGuilds, setAllBotGuilds] = useState<GuildConfig[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>('');
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Connect Server Inputs
  const [newGuildIdInput, setNewGuildIdInput] = useState('');
  const [newGuildNameInput, setNewGuildNameInput] = useState('');

  // Admin-Only Quick Inputs (NP Add & Change Bot PFP)
  const [npAddInput, setNpAddInput] = useState('');
  const [quickPfpInput, setQuickPfpInput] = useState('');
  const [whitelistUserInput, setWhitelistUserInput] = useState('');

  // Embed Builder State
  const [embedChannel, setEmbedChannel] = useState('#welcome');
  const [embedTitle, setEmbedTitle] = useState('Welcome to the Server');
  const [embedDesc, setEmbedDesc] = useState('Protected & powered by Cya.');
  const [embedColor, setEmbedColor] = useState('#6366f1');
  const [sendingEmbed, setSendingEmbed] = useState(false);

  // Giveaways State
  const [giveaways, setGiveaways] = useState<GiveawayItem[]>([
    {
      id: 'gw-1',
      prize: 'Cya Premium Plan (1 Month)',
      winners: 1,
      channel: '#giveaways',
      duration: '24h',
      endsAt: 'In 23 hours',
      active: true,
    },
  ]);
  const [gwPrize, setGwPrize] = useState('');
  const [gwWinners] = useState(1);
  const [gwChannel, setGwChannel] = useState('#giveaways');
  const [gwDuration, setGwDuration] = useState('24h');

  // Featured Communities & Live Discord Widgets State (Master Admin)
  const [featuredServers, setFeaturedServers] = useState<any[]>([]);
  const [widgetInput, setWidgetInput] = useState('');
  const [widgetInviteInput, setWidgetInviteInput] = useState('');
  const [widgetNameInput, setWidgetNameInput] = useState('');
  const [widgetMembersInput, setWidgetMembersInput] = useState('');
  const [resolvingWidget, setResolvingWidget] = useState(false);

  const isMasterAdmin = currentUser?.id === MASTER_DISCORD_ID;

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num || 0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  useEffect(() => {
    fetch('/api/featured-servers')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.servers)) setFeaturedServers(d.servers);
      })
      .catch(() => {});
  }, []);

  const handleAddFeaturedWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!widgetInput.trim() || !isMasterAdmin) return;
    setResolvingWidget(true);
    try {
      const res = await fetch('/api/featured-servers/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetHtml: widgetInput.trim(),
          inviteUrl: widgetInviteInput.trim(),
          name: widgetNameInput.trim() || undefined,
          memberCount: widgetMembersInput ? Number(widgetMembersInput) : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.server) {
          const updated = [...featuredServers.filter((s) => s.id !== data.server.id), data.server];
          setFeaturedServers(updated);
          await fetch('/api/featured-servers', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-discord-user-id': currentUser?.id || '',
            },
            body: JSON.stringify({ servers: updated }),
          });
          setWidgetInput('');
          setWidgetInviteInput('');
          setWidgetNameInput('');
          setWidgetMembersInput('');
          showToast(`✓ Added & auto-fetched "${data.server.name}" (${data.server.memberCount} members)!`);
        }
      }
    } finally {
      setResolvingWidget(false);
    }
  };

  const handleSaveFeaturedWidgets = async (nextList = featuredServers) => {
    if (!isMasterAdmin) return;
    const res = await fetch('/api/featured-servers', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-discord-user-id': currentUser?.id || '',
      },
      body: JSON.stringify({ servers: nextList }),
    });
    if (res.ok) {
      const d = await res.json();
      if (Array.isArray(d.servers)) setFeaturedServers(d.servers);
      showToast('✓ Featured Home Page Server Widgets saved!');
    }
  };

  const getDiscordOAuthUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-xnd7yjx4ckthqewf466huu-229885291959.asia-east1.run.app';
    const redirectUri = encodeURIComponent(`${origin}/auth/callback`);
    return `https://discord.com/oauth2/authorize?client_id=1552270485520384112&response_type=token&redirect_uri=${redirectUri}&scope=identify%20guilds&prompt=consent`;
  };

  const handleDiscordOAuthRedirect = () => {
    const oauthUrl = getDiscordOAuthUrl();
    const popup = window.open(oauthUrl, 'discord_oauth', 'width=520,height=680');
    if (!popup) {
      window.location.href = oauthUrl;
    }
  };

  // Listen for OAuth popup completion or implicit token hash, and immediately launch Discord OAuth2
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.user) {
        if (event.data.accessToken) {
          sessionStorage.setItem('cya_discord_access_token', event.data.accessToken);
        }
        sessionStorage.setItem('cya_dashboard_user', JSON.stringify(event.data.user));
        setCurrentUser(event.data.user);
        if (Array.isArray(event.data.guilds)) {
          const list: GuildConfig[] = event.data.guilds;
          const allList: GuildConfig[] = event.data.allGuilds || list;
          setGuilds(list);
          setAllBotGuilds(allList);
          if (list.length > 0) {
            setSelectedGuildId(list[0].guildId);
            setConfig(list[0]);
          } else {
            setSelectedGuildId('');
            setConfig(null);
          }
        }
        showToast(
          event.data.user.id === MASTER_DISCORD_ID
            ? '👑 Authorized via Discord OAuth2 as Master Owner'
            : `✓ Authorized via Discord OAuth2 as ${event.data.user.username}`
        );
      } else if (event.data?.type === 'BOT_INVITE_SUCCESS' && event.data?.guildId) {
        if (currentUser?.id) fetchGuilds(currentUser.id);
        showToast('✓ Cya Bot added to server — Manage unlocked!');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.location.hash.includes('access_token=')) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      if (accessToken) {
        sessionStorage.setItem('cya_discord_access_token', accessToken);
        Promise.all([
          fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }).then((r) => (r.ok ? r.json() : null)),
          fetch('https://discord.com/api/v10/users/@me/guilds?with_counts=true', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }).then((r) => (r.ok ? r.json() : [])),
        ])
          .then(async ([dUser, dGuilds]) => {
            if (dUser && dUser.id) {
              const avatarUrl = dUser.avatar
                ? `https://cdn.discordapp.com/avatars/${dUser.id}/${dUser.avatar}.png?size=256`
                : 'https://cdn.discordapp.com/embed/avatars/0.png';
              const res = await fetch('/api/dashboard/authorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: dUser.id,
                  username: dUser.global_name || dUser.username,
                  avatarUrl,
                  accessToken,
                  userGuilds: Array.isArray(dGuilds) ? dGuilds : [],
                }),
              });
              if (res.ok) {
                const data = await res.json();
                sessionStorage.setItem('cya_dashboard_user', JSON.stringify(data.user));
                setCurrentUser(data.user);
                if (Array.isArray(data.guilds)) {
                  setGuilds(data.guilds);
                  setAllBotGuilds(data.allGuilds || data.guilds);
                  if (data.guilds.length > 0) {
                    setSelectedGuildId(data.guilds[0].guildId);
                    setConfig(data.guilds[0]);
                  } else {
                    setSelectedGuildId('');
                    setConfig(null);
                  }
                }
                window.history.replaceState({}, '', '/dashboard');
              }
            }
          })
          .catch(() => {});
        return;
      }
    }

    // Directly redirect/open Discord OAuth2 when entering /dashboard without an active session
    if (!currentUser) {
      handleDiscordOAuthRedirect();
    }
  }, [currentUser]);

  const handleRefreshDiscordGuilds = async () => {
    const token = sessionStorage.getItem('cya_discord_access_token');
    if (!token || !currentUser) {
      handleDiscordOAuthRedirect();
      return;
    }
    try {
      const gRes = await fetch('https://discord.com/api/v10/users/@me/guilds?with_counts=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (gRes.ok) {
        const dGuilds = await gRes.json();
        const authRes = await fetch('/api/dashboard/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl,
            accessToken: token,
            userGuilds: Array.isArray(dGuilds) ? dGuilds : [],
          }),
        });
        if (authRes.ok) {
          const data = await authRes.json();
          const list: GuildConfig[] = data.guilds || [];
          setGuilds(list);
          setAllBotGuilds(data.allGuilds || list);
          if (list.length > 0) {
            if (!list.some((g) => g.guildId === selectedGuildId)) {
              setSelectedGuildId(list[0].guildId);
              setConfig(list[0]);
            }
          } else {
            setSelectedGuildId('');
            setConfig(null);
          }
        } else {
          await fetchGuilds(currentUser.id);
        }
        showToast('✓ Auto-fetched your Discord servers where you have Admin');
      } else {
        handleDiscordOAuthRedirect();
      }
    } catch {
      fetchGuilds(currentUser.id);
    }
  };

  const handleInviteBotToGuild = (guild: GuildConfig, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=1552270485520384112&permissions=8&integration_type=0&scope=bot%20applications.commands&guild_id=${encodeURIComponent(guild.guildId)}&disable_guild_select=true&response_type=code&redirect_uri=${redirectUri}`;
    window.open(inviteUrl, 'cya_bot_invite', 'width=540,height=720');
    showToast(`Opening Discord to add Cya to "${guild.guildName}"...`);
  };

  const handleMarkBotPresent = async (guild: GuildConfig, present = true, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/dashboard/guild/${encodeURIComponent(guild.guildId)}/verify-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botPresent: present }),
      });
      if (res.ok) {
        const data = await res.json();
        if (config?.guildId === guild.guildId) {
          setConfig(data.config);
        }
        if (currentUser?.id) await fetchGuilds(currentUser.id);
        showToast(
          present
            ? `✓ "${guild.guildName}" marked as Bot in Server — Manage unlocked!`
            : `Updated "${guild.guildName}" status`
        );
      }
    } catch {}
  };

  const handleManageGuild = async (guild: GuildConfig, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await handleSelectGuild(guild.guildId);
    setNavSection('servers');
  };

  const handleLogoutUser = () => {
    sessionStorage.removeItem('cya_dashboard_user');
    sessionStorage.removeItem('cya_discord_access_token');
    setCurrentUser(null);
    setGuilds([]);
    setAllBotGuilds([]);
    setSelectedGuildId('');
    setConfig(null);
    handleDiscordOAuthRedirect();
  };

  const fetchGuilds = async (uid = currentUser?.id) => {
    if (!uid) return;
    try {
      const token = sessionStorage.getItem('cya_discord_access_token') || '';
      const headers: Record<string, string> = { 'x-discord-user-id': uid };
      if (token) headers['x-discord-access-token'] = token;

      const res = await fetch(`/api/dashboard/guilds?userId=${encodeURIComponent(uid)}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        const list: GuildConfig[] = data.guilds || [];
        const allList: GuildConfig[] = data.allGuilds || list;
        setGuilds(list);
        setAllBotGuilds(allList);
        if (list.length === 0) {
          if (!isMasterAdmin) {
            setSelectedGuildId('');
            setConfig(null);
          }
        } else if (!selectedGuildId || !list.some((g) => g.guildId === selectedGuildId)) {
          setSelectedGuildId(list[0].guildId);
          setConfig(list[0]);
        } else {
          const found = list.find((g) => g.guildId === selectedGuildId) || allList.find((g) => g.guildId === selectedGuildId);
          if (found) setConfig(found);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchGuilds(currentUser.id);
      const interval = setInterval(() => fetchGuilds(currentUser.id), 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  const handleSelectGuild = async (gid: string) => {
    if (!currentUser) return;
    setSelectedGuildId(gid);
    try {
      const res = await fetch(`/api/dashboard/guild/${gid}`, {
        headers: { 'x-discord-user-id': currentUser.id },
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveConfig = async (overrideConfig?: GuildConfig) => {
    const target = overrideConfig || config;
    if (!target || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/guild/${target.guildId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-discord-user-id': currentUser.id,
        },
        body: JSON.stringify({
          ...target,
          authorizedUserId: currentUser.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        fetchGuilds(currentUser.id);
        showToast('✓ Saved & synced to Cya bot');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddServerById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const id = newGuildIdInput.trim();
    if (!id) return;
    const name = newGuildNameInput.trim() || `Workspace #${id.slice(-4)}`;
    try {
      const res = await fetch(`/api/dashboard/guild/${encodeURIComponent(id)}?name=${encodeURIComponent(name)}`, {
        headers: { 'x-discord-user-id': currentUser.id },
      });
      if (res.ok) {
        const data = await res.json();
        await fetchGuilds(currentUser.id);
        setSelectedGuildId(data.config.guildId);
        setConfig(data.config);
        setNewGuildIdInput('');
        setNewGuildNameInput('');
        showToast(`✓ Workspace "${data.config.guildName}" connected`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Master Admin Action (ONLY User ID 1364577822844387432)
  const handleMasterAdminAction = async (payload: Record<string, any>, successMsg: string) => {
    if (!config || !isMasterAdmin || !currentUser) return;
    try {
      const res = await fetch('/api/dashboard/admin/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-discord-user-id': currentUser.id,
        },
        body: JSON.stringify({
          guildId: config.guildId,
          guildName: config.guildName,
          authorizedUserId: currentUser.id,
          ...payload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setGuilds(data.guilds || guilds);
        showToast(successMsg);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = (field: 'avatarUrl' | 'bannerUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMasterAdmin) return;
    const file = e.target.files?.[0];
    if (!file || !config) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setConfig({
          ...config,
          customProfile: {
            ...config.customProfile,
            [field]: reader.result,
          },
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDispatchLiveEmbed = async () => {
    if (!config) return;
    setSendingEmbed(true);
    try {
      const res = await fetch(`/api/dashboard/guild/${config.guildId}/send-embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: embedChannel,
          title: embedTitle,
          description: embedDesc,
          color: embedColor,
          footer: 'cya.lat · Official Control Room',
        }),
      });
      if (res.ok) {
        showToast(`✓ Sent embed to ${embedChannel}`);
      }
    } catch {
      // ignore
    } finally {
      setSendingEmbed(false);
    }
  };

  const handleStartGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gwPrize.trim() || !config) return;
    const newGw: GiveawayItem = {
      id: `gw-${Date.now()}`,
      prize: gwPrize.trim(),
      winners: gwWinners,
      channel: gwChannel,
      duration: gwDuration,
      endsAt: `In ${gwDuration}`,
      active: true,
    };
    setGiveaways([newGw, ...giveaways]);
    await fetch(`/api/dashboard/guild/${config.guildId}/send-embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelName: gwChannel,
        title: `🎉 GIVEAWAY: ${gwPrize.trim()}`,
        description: `React with 🎉 to enter!\n• **Winners:** ${gwWinners}\n• **Duration:** ${gwDuration}`,
        color: '#818cf8',
        footer: `Hosted via Cya Control Room · Ends in ${gwDuration}`,
      }),
    }).catch(() => {});
    setGwPrize('');
    showToast(`✓ Giveaway "${newGw.prize}" launched in ${gwChannel}`);
  };

  // =======================================================
  // STEP 1: DIRECT DISCORD OAUTH2 REDIRECT (No Manual User ID Form)
  // =======================================================
  if (!currentUser) {
    return (
      <div className="cr-auth-gate">
        <div className="cr-auth-card" style={{ textAlign: 'center' }}>
          <div className="cr-brand" style={{ justifyContent: 'center', marginBottom: '22px' }}>
            <img
              src="https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=256"
              alt="cya"
              className="cr-brand-avatar"
              referrerPolicy="no-referrer"
            />
            <div className="cr-brand-text">
              <span className="cr-brand-name">cya`</span>
              <span className="cr-brand-tag">CONTROL</span>
            </div>
          </div>

          <span className="cr-eyebrow" style={{ textAlign: 'center' }}>DISCORD OAUTH2</span>
          <h1 className="cr-auth-title">Redirecting to Discord...</h1>
          <p className="cr-auth-desc">
            Connecting your Discord account via OAuth2 to open the Cya Control Room.
          </p>

          <button
            type="button"
            className="cr-oauth-btn"
            style={{ marginTop: '14px' }}
            onClick={handleDiscordOAuthRedirect}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.075.075 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.164-.394-.405-.875-.618-1.25a.077.077 0 0 0-.078-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.935 9.046-.319 13.58.099 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.042 2.423 5.993 3.03a.077.077 0 0 0 .084-.028c.461-.63.873-1.295 1.226-1.994a.077.077 0 0 0-.042-.105 12.3 12.3 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.082.082 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028Z" />
            </svg>
            <span>Continue with Discord OAuth2 →</span>
          </button>

          <button
            type="button"
            className="cr-footer-link"
            style={{ marginTop: '18px', textAlign: 'center', width: '100%' }}
            onClick={() => onNavigate('/')}
          >
            ← Back to cya.lat
          </button>
        </div>
      </div>
    );
  }

  // Calculate 6 Setup Modules readiness for selected server
  const setupChecklist = config
    ? [
        {
          key: 'welcome',
          label: 'Welcome & Embeds',
          ready: (config.savedEmbeds?.length || 0) > 0,
          targetTab: 'servers' as const,
        },
        {
          key: 'antinuke',
          label: 'Antinuke Shield',
          ready: Boolean(config.antinuke?.enabled),
          targetTab: 'servers' as const,
        },
        {
          key: 'noprefix',
          label: 'No-Prefix Mode (NP)',
          ready: Boolean(config.noPrefixMode),
          targetTab: 'admindash' as const,
        },
        {
          key: 'automod',
          label: 'AutoMod Filters',
          ready: Boolean(config.automod?.antiPhishing || config.automod?.antiInvites),
          targetTab: 'servers' as const,
        },
        {
          key: 'music',
          label: '24/7 Music & VoiceMaster',
          ready: Boolean(config.music?.mode247 || config.voicemaster?.enabled),
          targetTab: 'servers' as const,
        },
        {
          key: 'profile',
          label: 'Custom Bot PFP & Banner',
          ready: Boolean(config.customProfile?.bannerUrl),
          targetTab: 'admindash' as const,
        },
      ]
    : [];

  const readyCount = setupChecklist.filter((i) => i.ready).length;
  const readyPct = Math.round((readyCount / 6) * 100);

  return (
    <div className="cr-layout">
      {/* =======================================================
          LEFT CONTROL SIDEBAR WITH AUTHORIZED USER PROFILE
         ======================================================= */}
      <aside className="cr-sidebar">
        <div className="cr-brand" onClick={() => onNavigate('/')} role="button" tabIndex={0}>
          <img
            src="https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=256"
            alt="cya"
            className="cr-brand-avatar"
            referrerPolicy="no-referrer"
          />
          <div className="cr-brand-text">
            <span className="cr-brand-name">cya`</span>
            <span className="cr-brand-tag">CONTROL</span>
          </div>
        </div>

        {/* Authorized User Profile Card */}
        <div className="cr-user-profile-box">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.username}
            className="cr-user-avatar"
            referrerPolicy="no-referrer"
          />
          <div className="cr-user-info">
            <strong className="cr-user-name">{currentUser.username}</strong>
            <span className="cr-user-id">ID: {currentUser.id}</span>
            <span className={`cr-user-role ${isMasterAdmin ? 'owner' : ''}`}>
              {isMasterAdmin ? '👑 MASTER ADMIN' : 'USER WORKSPACE'}
            </span>
          </div>
        </div>

        <div className="cr-workspace-group">
          <span className="cr-sidebar-label">WORKSPACE</span>

          <nav className="cr-nav">
            <button
              type="button"
              className={`cr-nav-btn ${navSection === 'overview' ? 'active' : ''}`}
              onClick={() => setNavSection('overview')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Overview</span>
            </button>

            <button
              type="button"
              className={`cr-nav-btn ${navSection === 'servers' ? 'active' : ''}`}
              onClick={() => setNavSection('servers')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
              <span>Servers</span>
            </button>

            <button
              type="button"
              className={`cr-nav-btn ${navSection === 'admindash' ? 'active' : ''}`}
              onClick={() => setNavSection('admindash')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7l3-7z" />
              </svg>
              <span>AdminDash</span>
            </button>

            <button
              type="button"
              className={`cr-nav-btn ${navSection === 'giveaways' ? 'active' : ''}`}
              onClick={() => setNavSection('giveaways')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2l2.6 6.8L21 11.4l-6.4 2.6L12 21l-2.6-7-6.4-2.6 6.4-2.6L12 2z" />
              </svg>
              <span>Giveaways</span>
            </button>
          </nav>
        </div>

        <div className="cr-sidebar-footer">
          <button
            type="button"
            className="cr-footer-btn"
            onClick={handleLogoutUser}
          >
            Switch Account / Logout
          </button>
          <button
            type="button"
            className="cr-footer-link"
            onClick={() => onNavigate('/')}
          >
            ← Back to cya.lat
          </button>
        </div>
      </aside>

      {/* =======================================================
          MAIN CONTROL ROOM VIEWPORT
         ======================================================= */}
      <div className="cr-main">
        {/* =======================================================
            ADMIN TOP BAR — EXCLUSIVELY FOR USER ID 1364577822844387432
           ======================================================= */}
        {isMasterAdmin && config && (
          <div className="cr-admin-topbar">
            <div className="cr-admin-bar-inner">
              <div className="cr-admin-title">
                <span className="cr-dot-purple" />
                <strong>OWNER ADMIN TOP BAR (1364577822844387432)</strong>
                <span>·</span>
                <span>All Servers Visible ({guilds.length})</span>
              </div>

              <div className="cr-admin-actions">
                {/* 1. Quick NP Add (No-Prefix User Add) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!npAddInput.trim()) return;
                    handleMasterAdminAction(
                      { addNpUserId: npAddInput.trim(), noPrefixMode: true },
                      `✓ Added ${npAddInput.trim()} to No-Prefix (NP) list!`
                    );
                    setNpAddInput('');
                  }}
                  style={{ display: 'flex', gap: '6px' }}
                >
                  <input
                    type="text"
                    placeholder="NP Add User ID..."
                    value={npAddInput}
                    onChange={(e) => setNpAddInput(e.target.value)}
                  />
                  <button type="submit" className="cr-tier-chip active">
                    + NP Add
                  </button>
                </form>

                {/* 2. Quick Change Bot PFP */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!quickPfpInput.trim()) return;
                    handleMasterAdminAction(
                      { customAvatarUrl: quickPfpInput.trim() },
                      '✓ Updated Bot PFP for this workspace!'
                    );
                    setQuickPfpInput('');
                  }}
                  style={{ display: 'flex', gap: '6px' }}
                >
                  <input
                    type="text"
                    placeholder="New Bot PFP URL..."
                    value={quickPfpInput}
                    onChange={(e) => setQuickPfpInput(e.target.value)}
                  />
                  <button type="submit" className="cr-tier-chip active">
                    Set PFP
                  </button>
                </form>

                {/* 3. Plan Tier Grant */}
                {(['basic', 'starter', 'premium'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    className={`cr-tier-chip ${config.planTier === tier ? 'active' : ''}`}
                    onClick={() =>
                      handleMasterAdminAction(
                        { planTier: tier, noPrefixMode: tier !== 'basic' },
                        `✓ Set ${config.guildName} to ${tier.toUpperCase()} Plan`
                      )
                    }
                  >
                    {tier === 'basic' ? 'Free' : tier === 'starter' ? 'Starter Tier' : 'Premium Tier'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {toastMsg && <div className="cr-toast">{toastMsg}</div>}

        <div className="cr-content-container">
          {/* Top Hero Header: "Your control room." */}
          <header className="cr-header-row">
            <div>
              <span className="cr-eyebrow">CYA / DASHBOARD</span>
              <h1 className="cr-hero-title">Your control room.</h1>
              <p className="cr-hero-sub">
                Live server activity, settings, and giveaways in one place.
              </p>
            </div>

            <div className="cr-status-pill">
              <span className="cr-dot-purple" />
              <span>Bot online</span>
            </div>
          </header>

          {/* ===================================================
              TAB 1: OVERVIEW (Matches screenshot 1:1)
             =================================================== */}
          {navSection === 'overview' && (
            <>
              <div className="cr-sub-header-row">
                <div>
                  <span className="cr-eyebrow">LIVE OVERVIEW</span>
                  <h2 className="cr-section-title">Good to see you, {currentUser.username}.</h2>
                  <p className="cr-hero-sub">
                    Everything important about cya` and your communities, right here.
                  </p>
                </div>

                <div className="cr-status-pill">
                  <span className="cr-dot-purple" />
                  <span>Updating every 15 seconds</span>
                </div>
              </div>

              {/* 4 Stat Cards Row */}
              <div className="cr-stats-grid">
                <div className="cr-stat-card">
                  <div className="cr-stat-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <line x1="12" y1="4" x2="12" y2="20" />
                    </svg>
                  </div>
                  <strong className="cr-stat-val">
                    {formatNumber(isMasterAdmin ? (status?.servers ?? guilds.length) : guilds.length)}
                  </strong>
                  <span className="cr-stat-name">Servers</span>
                  <small className="cr-stat-meta">{guilds.length} shown in dashboard</small>
                </div>

                <div className="cr-stat-card">
                  <div className="cr-stat-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <circle cx="12" cy="7" r="3" />
                      <path d="M9 14h6l1.5 6h-9L9 14z" />
                      <line x1="7" y1="20" x2="17" y2="20" />
                    </svg>
                  </div>
                  <strong className="cr-stat-val">{formatNumber(status?.users ?? 20)}</strong>
                  <span className="cr-stat-name">Members</span>
                  <small className="cr-stat-meta">Across connected servers</small>
                </div>

                <div className="cr-stat-card">
                  <div className="cr-stat-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                    </svg>
                  </div>
                  <strong className="cr-stat-val">{formatNumber(status?.commands ?? 45)}</strong>
                  <span className="cr-stat-name">Commands</span>
                  <small className="cr-stat-meta">Available in cya`</small>
                </div>

                <div className="cr-stat-card">
                  <div className="cr-stat-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 3">
                      <circle cx="12" cy="12" r="8" />
                    </svg>
                  </div>
                  <strong className="cr-stat-val">{formatNumber(status?.latency ?? 14)}</strong>
                  <span className="cr-stat-name">Latency</span>
                  <small className="cr-stat-meta">Milliseconds to Discord</small>
                </div>
              </div>

              {/* Bottom 2-Column Split: "Pick a workspace" & "SETUP" */}
              <div className="cr-bottom-split">
                {/* Left Card: YOUR SERVERS -> Pick an admin server */}
                <section className="cr-panel-card">
                  <div className="cr-panel-top">
                    <div>
                      <span className="cr-eyebrow">SERVERS WHERE YOU HAVE ADMIN ({guilds.length})</span>
                      <h3 className="cr-panel-title">Pick an admin server</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="cr-view-all-link"
                        onClick={handleRefreshDiscordGuilds}
                        title="Sync your servers from Discord"
                      >
                        ↻ Sync Discord
                      </button>
                      <button
                        type="button"
                        className="cr-view-all-link"
                        onClick={() => setNavSection('servers')}
                      >
                        Manage →
                      </button>
                    </div>
                  </div>

                  <div className="cr-workspace-list">
                    {guilds.length === 0 ? (
                      <div style={{ fontSize: '13.5px', color: '#71717a', margin: '0 0 12px' }}>
                        <p style={{ margin: '0 0 10px' }}>
                          No admin Discord servers found yet. Click <strong>Sync Discord</strong> to auto-fetch servers where you have Administrator / Owner permissions:
                        </p>
                        <button
                          type="button"
                          className="cr-primary-btn"
                          onClick={handleRefreshDiscordGuilds}
                        >
                          ↻ Auto-Fetch My Admin Servers
                        </button>
                      </div>
                    ) : (
                      guilds.map((g) => {
                        const isSelected = g.guildId === selectedGuildId;
                        const initial = (g.guildName || 'C').charAt(0).toUpperCase();
                        const isBotPresent = Boolean(g.botPresent);
                        return (
                          <div
                            key={g.guildId}
                            className={`cr-workspace-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectGuild(g.guildId)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="cr-ws-left">
                              {g.iconUrl ? (
                                <img
                                  src={g.iconUrl}
                                  alt={g.guildName}
                                  style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="cr-ws-badge">{initial}</div>
                              )}
                              <div>
                                <strong className="cr-ws-name">{g.guildName}</strong>
                                <small className="cr-ws-plan" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{g.planTier.toUpperCase()} PLAN</span>
                                  <span>·</span>
                                  <span style={{ color: isBotPresent ? '#34d399' : '#fbbf24' }}>
                                    {isBotPresent ? '● Bot in Server' : '○ Bot Not in Server'}
                                  </span>
                                </small>
                              </div>
                            </div>
                            <div className="cr-ws-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{g.memberCount || 1} members</span>
                              {isBotPresent ? (
                                <button
                                  type="button"
                                  className="cr-primary-btn"
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                  onClick={(e) => handleManageGuild(g, e)}
                                >
                                  Manage →
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="cr-tier-chip active"
                                    style={{ padding: '6px 10px', fontSize: '11.5px', cursor: 'pointer' }}
                                    onClick={(e) => handleInviteBotToGuild(g, e)}
                                  >
                                    + Add Bot
                                  </button>
                                  <button
                                    type="button"
                                    className="cr-tier-chip"
                                    style={{ padding: '6px 9px', fontSize: '11px', cursor: 'pointer', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.35)' }}
                                    title="Click if Cya is already in this server to unlock Manage"
                                    onClick={(e) => handleMarkBotPresent(g, true, e)}
                                  >
                                    ✓ Bot In Server
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Add Server Form */}
                  <form onSubmit={handleAddServerById} className="cr-quick-add-server">
                    <input
                      type="text"
                      placeholder="Server ID..."
                      value={newGuildIdInput}
                      onChange={(e) => setNewGuildIdInput(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Server Name..."
                      value={newGuildNameInput}
                      onChange={(e) => setNewGuildNameInput(e.target.value)}
                    />
                    <button type="submit">+ Add</button>
                  </form>
                </section>

                {/* Right Card: SETUP -> Selected Workspace Setup */}
                <section className="cr-panel-card">
                  <div className="cr-panel-top">
                    <div>
                      <span className="cr-eyebrow">SETUP</span>
                      <h3 className="cr-panel-title">{config?.guildName || '(name TBD)'}</h3>
                    </div>
                    {config && (
                      <button
                        type="button"
                        className="cr-view-all-link"
                        onClick={() => setNavSection('servers')}
                      >
                        Configure →
                      </button>
                    )}
                  </div>

                  <div className="cr-setup-progress-head">
                    <strong>{readyCount} of 6 ready</strong>
                    <span>{readyPct}%</span>
                  </div>

                  <div className="cr-setup-bar-track">
                    <div className="cr-setup-bar-fill" style={{ width: `${readyPct}%` }} />
                  </div>

                  <div className="cr-setup-checklist">
                    {setupChecklist.map((item) => (
                      <div
                        key={item.key}
                        className="cr-setup-row"
                        onClick={() => setNavSection(item.targetTab)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="cr-setup-left">
                          <span className={`cr-setup-circle ${item.ready ? 'ready' : ''}`} />
                          <span>{item.label}</span>
                        </div>
                        <span className={`cr-setup-status ${item.ready ? 'ready' : ''}`}>
                          {item.ready ? 'Ready' : 'Not Set'}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ===================================================
              TAB 2: SERVERS — ONLY SERVERS WHERE USER HAS ADMIN
              (Manage Embeds, Prefix, Antinuke, AutoMod, VoiceMaster, Music)
             =================================================== */}
          {navSection === 'servers' && (
            <div className="cr-module-stack">
              {/* Top Server Switcher Bar (Only Servers Where User Has Admin) */}
              <div className="cr-panel-card" style={{ marginBottom: '18px' }}>
                <div className="cr-panel-top">
                  <div>
                    <span className="cr-eyebrow">ONLY SERVERS WHERE YOU HAVE ADMIN ({guilds.length})</span>
                    <h3 className="cr-panel-title">Your Admin Servers — Manage or Add Bot</h3>
                  </div>
                  <button
                    type="button"
                    className="cr-view-all-link"
                    onClick={handleRefreshDiscordGuilds}
                  >
                    ↻ Sync Admin Servers from Discord
                  </button>
                </div>

                {/* Group 1: Servers where Bot IS Installed */}
                {guilds.some((g) => g.botPresent) && (
                  <div style={{ marginBottom: '16px' }}>
                    <span className="cr-eyebrow" style={{ color: '#34d399', display: 'block', marginBottom: '8px' }}>
                      ● BOT IN SERVER — READY TO MANAGE ({guilds.filter((g) => g.botPresent).length})
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '12px' }}>
                      {guilds
                        .filter((g) => g.botPresent)
                        .map((g) => {
                          const isSelected = g.guildId === selectedGuildId;
                          return (
                            <div
                              key={g.guildId}
                              className={`cr-workspace-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleSelectGuild(g.guildId)}
                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}
                            >
                              <div className="cr-ws-left" style={{ minWidth: 0 }}>
                                {g.iconUrl ? (
                                  <img
                                    src={g.iconUrl}
                                    alt={g.guildName}
                                    style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="cr-ws-badge">{(g.guildName || 'S').charAt(0).toUpperCase()}</div>
                                )}
                                <div style={{ overflow: 'hidden' }}>
                                  <strong className="cr-ws-name" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {g.guildName}
                                  </strong>
                                  <small style={{ fontSize: '11px', color: '#34d399' }}>
                                    ● Cya Installed · {g.memberCount || 1} members
                                  </small>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="cr-primary-btn"
                                  style={{ padding: '6px 12px', fontSize: '11.5px', flexShrink: 0 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectGuild(g.guildId);
                                  }}
                                >
                                  {isSelected ? 'Managing' : 'Manage →'}
                                </button>
                                <button
                                  type="button"
                                  className="cr-tier-chip"
                                  style={{ padding: '6px 8px', fontSize: '11px', cursor: 'pointer', color: '#94a3b8' }}
                                  title="Bot not in this server? Move back to Not in Server"
                                  onClick={(e) => handleMarkBotPresent(g, false, e)}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Group 2: Admin Servers where Bot is NOT in Server Yet */}
                {guilds.some((g) => !g.botPresent) && (
                  <div>
                    <span className="cr-eyebrow" style={{ color: '#fbbf24', display: 'block', marginBottom: '8px' }}>
                      ○ BOT NOT IN SERVER YET — ADD BOT OR MARK INSTALLED ({guilds.filter((g) => !g.botPresent).length})
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
                      {guilds
                        .filter((g) => !g.botPresent)
                        .map((g) => {
                          const isSelected = g.guildId === selectedGuildId;
                          return (
                            <div
                              key={g.guildId}
                              className={`cr-workspace-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleSelectGuild(g.guildId)}
                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', gap: '8px' }}
                            >
                              <div className="cr-ws-left" style={{ minWidth: 0 }}>
                                {g.iconUrl ? (
                                  <img
                                    src={g.iconUrl}
                                    alt={g.guildName}
                                    style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="cr-ws-badge">{(g.guildName || 'S').charAt(0).toUpperCase()}</div>
                                )}
                                <div style={{ overflow: 'hidden' }}>
                                  <strong className="cr-ws-name" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {g.guildName}
                                  </strong>
                                  <small style={{ fontSize: '11px', color: '#fbbf24' }}>
                                    ○ Bot Not In Server
                                  </small>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button
                                  type="button"
                                  className="cr-tier-chip active"
                                  style={{ padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}
                                  onClick={(e) => handleInviteBotToGuild(g, e)}
                                >
                                  + Add Bot
                                </button>
                                <button
                                  type="button"
                                  className="cr-tier-chip"
                                  style={{ padding: '6px 8px', fontSize: '11px', cursor: 'pointer', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.35)' }}
                                  title="Already added Cya to this server? Click to move to Bot in Server"
                                  onClick={(e) => handleMarkBotPresent(g, true, e)}
                                >
                                  ✓ Already In
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {config && !config.botPresent && (
                <div className="cr-panel-card" style={{ border: '1px solid rgba(251, 191, 36, 0.35)', background: 'rgba(251, 191, 36, 0.05)', marginBottom: '18px' }}>
                  <div className="cr-panel-top" style={{ marginBottom: 0 }}>
                    <div>
                      <span className="cr-eyebrow" style={{ color: '#fbbf24' }}>BOT NOT IN SERVER YET</span>
                      <h3 className="cr-panel-title">Add Cya to "{config.guildName}" or mark as installed</h3>
                      <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: '#94a3b8' }}>
                        Invite Cya with one click, or if Cya is already in <strong>{config.guildName}</strong>, click <strong>✓ Bot Already in Server</strong> to move it to your active servers.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="cr-primary-btn"
                        onClick={() => handleInviteBotToGuild(config)}
                      >
                        + Add Cya to {config.guildName} →
                      </button>
                      <button
                        type="button"
                        className="cr-tier-chip active"
                        style={{ cursor: 'pointer', padding: '10px 14px' }}
                        onClick={() => handleMarkBotPresent(config, true)}
                      >
                        ✓ Bot Already in Server (Unlock Manage)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {config && (
                <>
                  <div className="cr-panel-card">
                    <div className="cr-panel-top">
                      <div>
                        <span className="cr-eyebrow">SERVER MANAGEMENT</span>
                        <h3 className="cr-panel-title">{config.guildName} — General, Prefix &amp; Modules</h3>
                      </div>
                      <button
                        type="button"
                        className="cr-primary-btn"
                        onClick={() => handleSaveConfig()}
                        disabled={saving}
                      >
                        {saving ? 'Syncing...' : 'Save & Sync to Bot'}
                      </button>
                    </div>

                    <div className="cr-form-grid">
                      <div className="cr-field">
                        <label>Server Name</label>
                        <input
                          type="text"
                          value={config.guildName}
                          onChange={(e) => setConfig({ ...config, guildName: e.target.value })}
                        />
                      </div>
                      <div className="cr-field">
                        <label>Command Prefix</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={config.prefix}
                          onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="cr-switch-list">
                      <div className="cr-switch-item">
                        <div>
                          <strong>AI Commands (<code>/ai ask</code> &amp; <code>/ai reason</code>)</strong>
                          <p>Unlock unlimited AI commands for all members in this workspace.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.aiCommandsEnabled}
                          onChange={(e) => setConfig({ ...config, aiCommandsEnabled: e.target.checked })}
                        />
                      </div>

                      <div className="cr-switch-item">
                        <div>
                          <strong>Early View of New Commands</strong>
                          <p>Get early access to experimental &amp; upcoming Cya commands.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.earlyAccessCommands}
                          onChange={(e) => setConfig({ ...config, earlyAccessCommands: e.target.checked })}
                        />
                      </div>

                      <div className="cr-switch-item">
                        <div>
                          <strong>24/7 Lossless Music &amp; VoiceMaster</strong>
                          <p>Keep Cya in voice channels 24/7 and enable dynamic Join-to-Create voice rooms.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.music.mode247}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              music: { ...config.music, mode247: e.target.checked },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom 2-Column Split: Unlimited Embed Manager + Server Antinuke & VoiceMaster */}
                  <div className="cr-bottom-split">
                    {/* Unlimited Custom Embeds Builder & Saved Embed Templates */}
                    <section className="cr-panel-card">
                      <div className="cr-panel-top">
                        <div>
                          <span className="cr-eyebrow">EMBED STUDIO · {config.guildName}</span>
                          <h3 className="cr-panel-title">Create, Save &amp; Send Embeds</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="cr-tier-chip active"
                            style={{ cursor: 'pointer', padding: '8px 12px' }}
                            onClick={() => {
                              const newEmbed = {
                                id: `emb-${Date.now()}`,
                                name: embedTitle || 'Custom Embed',
                                channelName: embedChannel,
                                title: embedTitle,
                                description: embedDesc,
                                color: embedColor,
                                footer: 'cya.lat · Official Server Bot',
                              };
                              const updatedConfig = {
                                ...config,
                                savedEmbeds: [newEmbed, ...(config.savedEmbeds || [])],
                              };
                              setConfig(updatedConfig);
                              handleSaveConfig(updatedConfig);
                            }}
                          >
                            + Save Embed
                          </button>
                          <button
                            type="button"
                            className="cr-primary-btn"
                            onClick={handleDispatchLiveEmbed}
                            disabled={sendingEmbed}
                          >
                            {sendingEmbed ? 'Sending...' : 'Send to Discord'}
                          </button>
                        </div>
                      </div>

                      <div className="cr-form-grid">
                        <div className="cr-field">
                          <label>Target Channel</label>
                          <input
                            type="text"
                            value={embedChannel}
                            onChange={(e) => setEmbedChannel(e.target.value)}
                          />
                        </div>
                        <div className="cr-field">
                          <label>Accent Color (Hex)</label>
                          <input
                            type="text"
                            value={embedColor}
                            onChange={(e) => setEmbedColor(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="cr-field" style={{ marginTop: '12px' }}>
                        <label>Embed Title</label>
                        <input
                          type="text"
                          value={embedTitle}
                          onChange={(e) => setEmbedTitle(e.target.value)}
                        />
                      </div>

                      <div className="cr-field" style={{ marginTop: '12px' }}>
                        <label>Embed Description</label>
                        <textarea
                          rows={3}
                          value={embedDesc}
                          onChange={(e) => setEmbedDesc(e.target.value)}
                        />
                      </div>

                      {/* Live Discord Embed Preview */}
                      <div
                        style={{
                          marginTop: '14px',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: '#11131a',
                          borderLeft: `4px solid ${embedColor || '#6366f1'}`,
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700, marginBottom: '4px' }}>
                          LIVE PREVIEW ({embedChannel})
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                          {embedTitle || 'Untitled Embed'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                          {embedDesc || 'Embed description...'}
                        </div>
                      </div>

                      {/* Saved Embeds List for this Server */}
                      {(config.savedEmbeds || []).length > 0 && (
                        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <span className="cr-eyebrow">SAVED SERVER EMBEDS ({(config.savedEmbeds || []).length})</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                            {(config.savedEmbeds || []).map((emb) => (
                              <div
                                key={emb.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 12px',
                                  borderRadius: '10px',
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                }}
                              >
                                <div>
                                  <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{emb.title}</strong>
                                  <span style={{ fontSize: '11.5px', color: '#94a3b8', marginLeft: '8px' }}>
                                    {emb.channelName}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="cr-tier-chip active"
                                    style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                                    onClick={() => {
                                      setEmbedChannel(emb.channelName);
                                      setEmbedTitle(emb.title);
                                      setEmbedDesc(emb.description);
                                      setEmbedColor(emb.color || '#6366f1');
                                    }}
                                  >
                                    Load
                                  </button>
                                  <button
                                    type="button"
                                    className="cr-tier-chip"
                                    style={{ padding: '4px 8px', fontSize: '11px', color: '#f87171', cursor: 'pointer' }}
                                    onClick={() => {
                                      const next = (config.savedEmbeds || []).filter((x) => x.id !== emb.id);
                                      const updated = { ...config, savedEmbeds: next };
                                      setConfig(updated);
                                      handleSaveConfig(updated);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>

                    {/* Server Defense, AutoMod & VoiceMaster Settings */}
                    <section className="cr-panel-card">
                      <div className="cr-panel-top">
                        <div>
                          <span className="cr-eyebrow">VOICE &amp; PROTECTION · {config.guildName}</span>
                          <h3 className="cr-panel-title">Antinuke, AutoMod &amp; VoiceMaster</h3>
                        </div>
                        <button
                          type="button"
                          className="cr-primary-btn"
                          onClick={() => handleSaveConfig()}
                          disabled={saving}
                        >
                          Save Rules
                        </button>
                      </div>

                      <div className="cr-switch-list">
                        <div className="cr-switch-item">
                          <div>
                            <strong>Autonomous Antinuke Shield</strong>
                            <p>Protect channels, roles, and webhooks with &lt;20ms response.</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={config.antinuke.enabled}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                antinuke: { ...config.antinuke, enabled: e.target.checked },
                              })
                            }
                          />
                        </div>

                        <div className="cr-switch-item">
                          <div>
                            <strong>AutoMod Phishing &amp; Invite Blocker</strong>
                            <p>Filter scam links, invite spam, and malicious domains.</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={config.automod.antiPhishing}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                automod: {
                                  ...config.automod,
                                  antiPhishing: e.target.checked,
                                  antiInvites: e.target.checked,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="cr-form-grid" style={{ marginTop: '14px' }}>
                        <div className="cr-field">
                          <label>VoiceMaster Hub Channel</label>
                          <input
                            type="text"
                            value={config.voicemaster.hubChannelName}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                voicemaster: { ...config.voicemaster, hubChannelName: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div className="cr-field">
                          <label>Moderation Log Channel</label>
                          <input
                            type="text"
                            value={config.automod.logChannel}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                automod: { ...config.automod, logChannel: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===================================================
              TAB 3: ADMINDASH (Replaces Security Tab — NP Add, Bot PFP & Banner, Plan Grants, All Bot Servers)
             =================================================== */}
          {navSection === 'admindash' && (
            <div className="cr-module-stack" style={{ marginTop: '24px' }}>
              {isMasterAdmin && config ? (
                <>
                  {/* Top Card: NP Add (No-Prefix Manager) & Plan Tier Controller */}
                  <div className="cr-panel-card">
                    <div className="cr-panel-top">
                      <div>
                        <span className="cr-eyebrow">👑 ADMINDASH · MASTER OWNER (1364577822844387432)</span>
                        <h3 className="cr-panel-title">NP Add (No-Prefix Manager) &amp; Plan Controller — {config.guildName}</h3>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(['basic', 'starter', 'premium'] as const).map((tier) => (
                          <button
                            key={tier}
                            type="button"
                            className={`cr-tier-chip ${config.planTier === tier ? 'active' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                              handleMasterAdminAction(
                                { planTier: tier, noPrefixMode: tier !== 'basic' },
                                `✓ Set ${config.guildName} to ${tier.toUpperCase()} Plan`
                              )
                            }
                          >
                            {tier === 'basic' ? 'Free Tier' : tier === 'starter' ? 'Starter Plan' : 'Premium Plan'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="cr-switch-list">
                      <div className="cr-switch-item">
                        <div>
                          <strong>Global No-Prefix Mode (NP)</strong>
                          <p>Allow whitelisted NP users and server members to run Cya commands without typing a prefix.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.noPrefixMode}
                          onChange={(e) =>
                            handleMasterAdminAction(
                              { noPrefixMode: e.target.checked },
                              `✓ No-Prefix Mode ${e.target.checked ? 'ENABLED' : 'DISABLED'} for ${config.guildName}`
                            )
                          }
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '18px' }}>
                      <span className="cr-eyebrow">ADD USER TO NO-PREFIX (NP ADD)</span>
                      <div className="cr-quick-add-server" style={{ marginTop: '8px' }}>
                        <input
                          type="text"
                          placeholder="Enter Discord User ID to NP Add (e.g. 1364577822844387432)..."
                          value={npAddInput}
                          onChange={(e) => setNpAddInput(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!npAddInput.trim()) return;
                            handleMasterAdminAction(
                              { addNpUserId: npAddInput.trim(), noPrefixMode: true },
                              `✓ Added ${npAddInput.trim()} to No-Prefix (NP) list`
                            );
                            setNpAddInput('');
                          }}
                        >
                          + NP Add User
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                        {(config.noPrefixUsers || []).length === 0 ? (
                          <span style={{ fontSize: '12.5px', color: '#71717a' }}>No users added to NP list yet.</span>
                        ) : (
                          (config.noPrefixUsers || []).map((uid) => (
                            <span key={uid} className="cr-tier-chip active" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <code>NP: {uid}</code>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 800 }}
                                onClick={() =>
                                  handleMasterAdminAction(
                                    { removeNpUserId: uid },
                                    `Removed ${uid} from No-Prefix list`
                                  )
                                }
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom 2-Column Split: Custom Bot PFP & Banner + All Bot Servers Inspector */}
                  <div className="cr-bottom-split" style={{ marginTop: '18px' }}>
                    <section className="cr-panel-card">
                      <div className="cr-panel-top">
                        <div>
                          <span className="cr-eyebrow">👑 BOT CUSTOMIZATION (OWNER ONLY)</span>
                          <h3 className="cr-panel-title">Change Bot PFP, Banner &amp; Nickname</h3>
                        </div>
                        <button
                          type="button"
                          className="cr-primary-btn"
                          onClick={() => handleSaveConfig()}
                          disabled={saving}
                        >
                          {saving ? 'Applying...' : 'Apply PFP & Banner'}
                        </button>
                      </div>

                      <div className="cr-field">
                        <label>Server Bot Nickname</label>
                        <input
                          type="text"
                          value={config.customProfile.nickname}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              customProfile: { ...config.customProfile, nickname: e.target.value },
                            })
                          }
                        />
                      </div>

                      <div className="cr-field" style={{ marginTop: '12px' }}>
                        <label>Custom Bot Profile Picture (PFP) URL or Upload</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={config.customProfile.avatarUrl}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              customProfile: { ...config.customProfile, avatarUrl: e.target.value },
                            })
                          }
                        />
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload('avatarUrl', e)} style={{ marginTop: '6px', fontSize: '12px' }} />
                      </div>

                      <div className="cr-field" style={{ marginTop: '12px' }}>
                        <label>Custom Profile Banner URL or Upload</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={config.customProfile.bannerUrl}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              customProfile: { ...config.customProfile, bannerUrl: e.target.value },
                            })
                          }
                        />
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload('bannerUrl', e)} style={{ marginTop: '6px', fontSize: '12px' }} />
                      </div>
                    </section>

                    <section className="cr-panel-card">
                      <div className="cr-panel-top">
                        <div>
                          <span className="cr-eyebrow">👑 GLOBAL BOT REGISTRY (OWNER ONLY)</span>
                          <h3 className="cr-panel-title">All Connected Servers ({allBotGuilds.length})</h3>
                        </div>
                      </div>

                      <div className="cr-workspace-list">
                        {allBotGuilds.map((g) => {
                          const isSelected = g.guildId === selectedGuildId;
                          return (
                            <div
                              key={g.guildId}
                              className={`cr-workspace-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleSelectGuild(g.guildId)}
                              role="button"
                              tabIndex={0}
                            >
                              <div className="cr-ws-left">
                                {g.iconUrl ? (
                                  <img
                                    src={g.iconUrl}
                                    alt={g.guildName}
                                    style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="cr-ws-badge">{(g.guildName || 'C').charAt(0).toUpperCase()}</div>
                                )}
                                <div>
                                  <strong className="cr-ws-name">{g.guildName}</strong>
                                  <small className="cr-ws-plan">
                                    ID: {g.guildId} · {g.planTier.toUpperCase()} · NP Users: {(g.noPrefixUsers || []).length}
                                  </small>
                                </div>
                              </div>
                              <div className="cr-ws-right">
                                <span style={{ fontSize: '12px', color: '#818cf8' }}>
                                  {isSelected ? 'Selected' : 'Select →'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>

                  {/* Featured Home Page Server Widgets Editor */}
                  <section className="cr-panel-card" style={{ marginTop: '24px' }}>
                    <div className="cr-panel-top">
                      <div>
                        <span className="cr-eyebrow">✨ HOME PAGE MOVING SERVER SHOWCASE &amp; DISCORD WIDGETS</span>
                        <h3 className="cr-panel-title">Edit Featured Server Widgets ({featuredServers.length})</h3>
                      </div>
                      <button
                        type="button"
                        className="cr-primary-btn"
                        onClick={() => handleSaveFeaturedWidgets(featuredServers)}
                      >
                        Save Showcase Changes
                      </button>
                    </div>

                    <form onSubmit={handleAddFeaturedWidget} className="cr-form-grid" style={{ marginBottom: '18px' }}>
                      <div className="cr-field" style={{ gridColumn: '1 / -1' }}>
                        <label>Paste Discord Widget Iframe or Server ID to Add &amp; Auto-Fetch</label>
                        <input
                          type="text"
                          placeholder='e.g. 1508096258185887884 or <iframe src="https://discord.com/widget?id=1508096258185887884&theme=dark" ...></iframe>'
                          value={widgetInput}
                          onChange={(e) => setWidgetInput(e.target.value)}
                          required
                        />
                      </div>
                      <div className="cr-field">
                        <label>Optional: Server Name (Leave blank to auto-fetch)</label>
                        <input
                          type="text"
                          placeholder="Auto-fetched"
                          value={widgetNameInput}
                          onChange={(e) => setWidgetNameInput(e.target.value)}
                        />
                      </div>
                      <div className="cr-field">
                        <label>Optional: Member Count (Leave blank to auto-fetch)</label>
                        <input
                          type="number"
                          placeholder="Auto-fetched"
                          value={widgetMembersInput}
                          onChange={(e) => setWidgetMembersInput(e.target.value)}
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <button type="submit" className="cr-primary-btn" disabled={resolvingWidget}>
                          {resolvingWidget ? 'Auto-Fetching...' : '+ Add & Auto-Fetch Server Widget'}
                        </button>
                      </div>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {featuredServers.map((srv, idx) => (
                        <div
                          key={srv.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '42px 1.4fr 110px 1.2fr auto',
                            gap: '10px',
                            alignItems: 'center',
                            padding: '10px 14px',
                            borderRadius: '14px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                          }}
                        >
                          <img
                            src={srv.iconUrl}
                            alt={srv.name}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                            referrerPolicy="no-referrer"
                          />
                          <div className="cr-field" style={{ margin: 0 }}>
                            <label style={{ fontSize: '10px' }}>#{idx + 1} · ID: {srv.id}</label>
                            <input
                              type="text"
                              value={srv.name}
                              onChange={(e) =>
                                setFeaturedServers((prev) =>
                                  prev.map((s) => (s.id === srv.id ? { ...s, name: e.target.value } : s))
                                )
                              }
                            />
                          </div>
                          <div className="cr-field" style={{ margin: 0 }}>
                            <label style={{ fontSize: '10px' }}>Members</label>
                            <input
                              type="number"
                              value={srv.memberCount}
                              onChange={(e) =>
                                setFeaturedServers((prev) =>
                                  prev.map((s) => (s.id === srv.id ? { ...s, memberCount: Number(e.target.value) } : s))
                                )
                              }
                            />
                          </div>
                          <div className="cr-field" style={{ margin: 0 }}>
                            <label style={{ fontSize: '10px' }}>Icon URL</label>
                            <input
                              type="text"
                              value={srv.iconUrl}
                              onChange={(e) =>
                                setFeaturedServers((prev) =>
                                  prev.map((s) => (s.id === srv.id ? { ...s, iconUrl: e.target.value } : s))
                                )
                              }
                            />
                          </div>
                          <button
                            type="button"
                            className="cr-ghost-btn"
                            onClick={() => {
                              const next = featuredServers.filter((s) => s.id !== srv.id);
                              setFeaturedServers(next);
                              handleSaveFeaturedWidgets(next);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                <div className="cr-panel-card">
                  <span className="cr-eyebrow">🔒 RESTRICTED WORKSPACE</span>
                  <h3 className="cr-panel-title">AdminDash — Master Owner Only</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px', lineHeight: 1.6 }}>
                    <strong>AdminDash</strong> (NP Add / No-Prefix user management, Custom Bot Profile Picture &amp; Banner overrides, Plan Tier grants, and viewing all connected Cya servers) is locked exclusively to Master Owner Discord ID <code>1364577822844387432</code>.
                  </p>
                  <p style={{ color: '#71717a', fontSize: '13px', marginTop: '10px', marginBottom: 0 }}>
                    Currently signed in as: <strong>{currentUser.username}</strong> (<code>{currentUser.id}</code>)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===================================================
              TAB 4: GIVEAWAYS
             =================================================== */}
          {navSection === 'giveaways' && (
            <div className="cr-bottom-split" style={{ marginTop: '28px' }}>
              <section className="cr-panel-card">
                <div className="cr-panel-top">
                  <div>
                    <span className="cr-eyebrow">LAUNCH GIVEAWAY</span>
                    <h3 className="cr-panel-title">Create a giveaway</h3>
                  </div>
                </div>

                <form onSubmit={handleStartGiveaway} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="cr-field">
                    <label>Prize Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Discord Nitro or Cya Premium"
                      value={gwPrize}
                      onChange={(e) => setGwPrize(e.target.value)}
                      required
                    />
                  </div>

                  <div className="cr-form-grid">
                    <div className="cr-field">
                      <label>Channel</label>
                      <input
                        type="text"
                        value={gwChannel}
                        onChange={(e) => setGwChannel(e.target.value)}
                      />
                    </div>
                    <div className="cr-field">
                      <label>Duration</label>
                      <input
                        type="text"
                        placeholder="24h"
                        value={gwDuration}
                        onChange={(e) => setGwDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="cr-primary-btn">
                    ✨ Launch Giveaway in {gwChannel}
                  </button>
                </form>
              </section>

              <section className="cr-panel-card">
                <div className="cr-panel-top">
                  <div>
                    <span className="cr-eyebrow">ACTIVE EVENTS</span>
                    <h3 className="cr-panel-title">Running giveaways</h3>
                  </div>
                </div>

                <div className="cr-workspace-list">
                  {giveaways.map((gw) => (
                    <div key={gw.id} className="cr-workspace-item">
                      <div className="cr-ws-left">
                        <div className="cr-ws-badge">🎉</div>
                        <div>
                          <strong className="cr-ws-name">{gw.prize}</strong>
                          <small className="cr-ws-plan">{gw.channel} · {gw.winners} Winner(s)</small>
                        </div>
                      </div>
                      <div className="cr-ws-right">
                        <span>{gw.endsAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
