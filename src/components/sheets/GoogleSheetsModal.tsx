import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import { DriveSpreadsheet } from '../../services/googleSheets';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  PlusCircle,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Clock,
  ShieldCheck,
  Unlink,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GoogleSheetsModal: React.FC = () => {
  const {
    sheetsModalOpen,
    closeSheetsModal,
    googleUser,
    isGoogleSigningIn,
    signInWithGoogleAccount,
    signOutGoogleAccount,
    connectedSpreadsheetId,
    connectedSpreadsheetName,
    connectedSpreadsheetUrl,
    lastSheetsSyncTime,
    isSheetsSyncing,
    connectSpreadsheet,
    disconnectSpreadsheet,
    exportToNewGoogleSheet,
    syncToConnectedSheet,
    importFromConnectedSheet,
    fetchDriveSpreadsheets,
    clients,
    purchases,
    bookings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'sync' | 'create' | 'browse'>('sync');
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [driveSheets, setDriveSheets] = useState<DriveSpreadsheet[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');
  
  // Confirmation state for destructive/modifying operations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'danger' | 'primary';
    action: () => void;
  } | null>(null);

  useEffect(() => {
    if (sheetsModalOpen) {
      setNewSheetTitle(`Client Sessions & Bookings (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`);
      if (googleUser && activeTab === 'browse') {
        loadDriveFiles();
      }
    }
  }, [sheetsModalOpen, googleUser, activeTab]);

  const loadDriveFiles = async () => {
    if (!googleUser) return;
    setIsLoadingDrive(true);
    try {
      const list = await fetchDriveSpreadsheets();
      setDriveSheets(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  if (!sheetsModalOpen) return null;

  const handlePushSync = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Update Google Spreadsheet?',
      description: `This will overwrite the data in tabs "Clients", "Purchases", and "Bookings" in "${connectedSpreadsheetName || 'your spreadsheet'}" with your current local records (${clients.length} clients, ${purchases.length} purchases, ${bookings.length} bookings).`,
      confirmText: 'Yes, Sync to Google Sheets',
      variant: 'primary',
      action: async () => {
        setConfirmDialog(null);
        await syncToConnectedSheet();
      },
    });
  };

  const handlePullImport = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Import Data from Google Sheets?',
      description: `This will replace your current in-app client, purchase, and booking records with data loaded from "${connectedSpreadsheetName || 'the connected sheet'}".`,
      confirmText: 'Yes, Overwrite & Import',
      variant: 'danger',
      action: async () => {
        setConfirmDialog(null);
        await importFromConnectedSheet();
      },
    });
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newSheetTitle.trim();
    if (!title) return;
    const res = await exportToNewGoogleSheet(title);
    if (res.success) {
      setActiveTab('sync');
    }
  };

  const handleSelectDriveSheet = (sheet: DriveSpreadsheet) => {
    connectSpreadsheet(sheet);
    setActiveTab('sync');
  };

  const filteredDriveSheets = driveSheets.filter((s) =>
    s.name.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSheetsModal}
          className="absolute inset-0 bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#141722] border border-[#262c3e] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#232838]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Google Sheets Integration</h3>
                <p className="text-xs text-gray-400">Live 2-Way Sync & Drive Storage</p>
              </div>
            </div>
            <button
              onClick={closeSheetsModal}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Google Auth Status Card */}
            {!googleUser ? (
              <div className="p-4 bg-[#1a1f2c] border border-[#272e40] rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Connect Your Google Account</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Grant permission to create and sync client session records directly with Google Sheets.
                  </p>
                </div>
                <div className="pt-1">
                  <GoogleSignInButton
                    onClick={signInWithGoogleAccount}
                    loading={isGoogleSigningIn}
                    text="Sign in with Google"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#181d29] border border-[#252c3e] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-emerald-500/40 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                      {googleUser.email ? googleUser.email.slice(0, 2).toUpperCase() : 'G'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {googleUser.displayName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{googleUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={signOutGoogleAccount}
                  className="p-1.5 text-xs text-gray-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/30 flex items-center gap-1 shrink-0 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Sign Out</span>
                </button>
              </div>
            )}

            {/* If Logged in, show Tabs and features */}
            {googleUser && (
              <>
                {/* Tab Navigation */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#10131b] rounded-xl border border-[#202534]">
                  <button
                    onClick={() => setActiveTab('sync')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'sync'
                        ? 'bg-amber-400 text-gray-950 shadow-xs'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Sync Hub
                  </button>
                  <button
                    onClick={() => setActiveTab('create')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'create'
                        ? 'bg-amber-400 text-gray-950 shadow-xs'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    + New Sheet
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('browse');
                      loadDriveFiles();
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'browse'
                        ? 'bg-amber-400 text-gray-950 shadow-xs'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Browse Drive
                  </button>
                </div>

                {/* TAB 1: SYNC HUB */}
                {activeTab === 'sync' && (
                  <div className="space-y-4">
                    {/* Active Connected Spreadsheet Card */}
                    <div className="p-4 bg-[#191e2b] border border-[#262c3e] rounded-2xl">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            Connected Spreadsheet
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1.5">
                            {connectedSpreadsheetName || 'No Spreadsheet Linked Yet'}
                          </h4>
                          {lastSheetsSyncTime && (
                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Last synced today at {lastSheetsSyncTime}
                            </p>
                          )}
                        </div>

                        {connectedSpreadsheetUrl && (
                          <a
                            href={connectedSpreadsheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-[#232a3d] hover:bg-emerald-500/20 text-emerald-400 border border-[#313b52] hover:border-emerald-500/40 transition-colors shrink-0 flex items-center gap-1 text-xs font-semibold"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {connectedSpreadsheetId ? (
                        <div className="space-y-2 pt-2 border-t border-[#262c3e]">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={handlePushSync}
                              disabled={isSheetsSyncing}
                              className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/15 disabled:opacity-50"
                            >
                              <UploadCloud className="w-4 h-4" />
                              <span>{isSheetsSyncing ? 'Syncing...' : 'Sync to Sheet'}</span>
                            </button>

                            <button
                              onClick={handlePullImport}
                              disabled={isSheetsSyncing}
                              className="py-2.5 px-3 rounded-xl bg-[#252c3e] hover:bg-[#2e364c] text-gray-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-[#37415b] transition-all disabled:opacity-50"
                            >
                              <DownloadCloud className="w-4 h-4 text-blue-400" />
                              <span>Import from Sheet</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={disconnectSpreadsheet}
                              className="text-[11px] text-gray-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                            >
                              <Unlink className="w-3 h-3" />
                              <span>Disconnect sheet</span>
                            </button>

                            <span className="text-[11px] text-gray-500">
                              3 sheets: Clients, Purchases, Bookings
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 text-center">
                          <p className="text-xs text-gray-400 mb-3">
                            Export your records to a new Google Sheet or link an existing one to enable sync.
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setActiveTab('create')}
                              className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs flex items-center justify-center gap-1.5"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span>Create New</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('browse');
                                loadDriveFiles();
                              }}
                              className="py-2 px-3 rounded-xl bg-[#23293a] text-gray-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-[#2e364c]"
                            >
                              <FolderOpen className="w-4 h-4 text-blue-400" />
                              <span>Browse Drive</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Data Summary to be synced */}
                    <div className="p-3 bg-[#11141c] border border-[#212634] rounded-xl">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span className="font-semibold text-gray-300">Ready to Sync</span>
                        <span>Auto-formatted Tabs</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-[#181c27] rounded-lg border border-[#262c3e]">
                          <span className="text-gray-400 block text-[10px]">Clients</span>
                          <span className="font-bold text-white text-sm">{clients.length}</span>
                        </div>
                        <div className="p-2 bg-[#181c27] rounded-lg border border-[#262c3e]">
                          <span className="text-gray-400 block text-[10px]">Purchases</span>
                          <span className="font-bold text-white text-sm">{purchases.length}</span>
                        </div>
                        <div className="p-2 bg-[#181c27] rounded-lg border border-[#262c3e]">
                          <span className="text-gray-400 block text-[10px]">Bookings</span>
                          <span className="font-bold text-white text-sm">{bookings.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CREATE NEW SPREADSHEET */}
                {activeTab === 'create' && (
                  <form onSubmit={handleCreateNew} className="space-y-4">
                    <div className="p-4 bg-[#191e2b] border border-[#262c3e] rounded-2xl space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                          Spreadsheet Title
                        </label>
                        <input
                          type="text"
                          required
                          value={newSheetTitle}
                          onChange={(e) => setNewSheetTitle(e.target.value)}
                          placeholder="e.g. Client Sessions & Bookings"
                          className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="text-xs text-gray-400 space-y-1 bg-[#12151d] p-3 rounded-xl border border-[#222838]">
                        <p className="font-semibold text-gray-300">Automatic Configuration:</p>
                        <ul className="list-disc pl-4 space-y-0.5 text-gray-400">
                          <li>Creates <span className="text-emerald-400">Clients</span> tab with balances</li>
                          <li>Creates <span className="text-purple-400">Purchases</span> tab with hours</li>
                          <li>Creates <span className="text-amber-400">Bookings</span> tab with dates & times</li>
                        </ul>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSheetsSyncing}
                      className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                    >
                      {isSheetsSyncing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Creating & Populating Google Sheet...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4" />
                          <span>Create & Export All Records</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* TAB 3: BROWSE DRIVE */}
                {activeTab === 'browse' && (
                  <div className="space-y-3">
                    {/* Search & Refresh Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={driveSearch}
                          onChange={(e) => setDriveSearch(e.target.value)}
                          placeholder="Search spreadsheets in Drive..."
                          className="w-full bg-[#11141c] border border-[#272e40] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <button
                        onClick={loadDriveFiles}
                        disabled={isLoadingDrive}
                        className="p-2 rounded-xl bg-[#1d2230] text-gray-300 hover:text-white border border-[#272e40]"
                        title="Reload list"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingDrive ? 'animate-spin text-amber-400' : ''}`} />
                      </button>
                    </div>

                    {/* List */}
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {isLoadingDrive ? (
                        <div className="py-8 text-center text-xs text-gray-400 space-y-2">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400" />
                          <p>Fetching Google Drive spreadsheets...</p>
                        </div>
                      ) : filteredDriveSheets.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400 bg-[#141722] rounded-xl border border-[#202534]">
                          <FolderOpen className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                          <p>No matching spreadsheets found in Google Drive.</p>
                        </div>
                      ) : (
                        filteredDriveSheets.map((sheet) => {
                          const isConnected = connectedSpreadsheetId === sheet.id;
                          return (
                            <div
                              key={sheet.id}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                                isConnected
                                  ? 'bg-emerald-950/30 border-emerald-500/50'
                                  : 'bg-[#181d29] border-[#252b3b] hover:border-gray-600'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <p className="text-xs font-bold text-white truncate">{sheet.name}</p>
                                </div>
                                {sheet.modifiedTime && (
                                  <p className="text-[10px] text-gray-500 mt-0.5">
                                    Modified {new Date(sheet.modifiedTime).toLocaleDateString()}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => handleSelectDriveSheet(sheet)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                                  isConnected
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-400 hover:bg-amber-300 text-gray-950'
                                }`}
                              >
                                {isConnected ? 'Connected' : 'Select'}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-[#232838] flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Secure OAuth2 Bearer Token
            </span>
            <button
              onClick={closeSheetsModal}
              className="text-gray-400 hover:text-white font-medium"
            >
              Close
            </button>
          </div>

          {/* Explicit User Confirmation Dialog (MANDATORY per Workspace guidelines) */}
          {confirmDialog && (
            <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-xs rounded-2xl flex items-center justify-center p-5">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full bg-[#181d2a] border border-[#2b3346] rounded-2xl p-5 shadow-2xl space-y-4 text-center"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
                    confirmDialog.variant === 'danger'
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                      : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{confirmDialog.title}</h4>
                  <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                    {confirmDialog.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-gray-300 bg-[#222838] hover:bg-[#2b3245] border border-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDialog.action}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors ${
                      confirmDialog.variant === 'danger'
                        ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20'
                        : 'bg-amber-400 hover:bg-amber-300 text-gray-950 shadow-lg shadow-amber-500/20'
                    }`}
                  >
                    {confirmDialog.confirmText}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
