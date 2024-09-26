/*
<AQUA: System-wide parametric audio equalizer interface>
Copyright (C) <2023>  <AQUA Dev Team>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.scss';
import { useCallback, useMemo, useState } from 'react';
import {
  CONFIG_FILE_PATH_PLACEHOLDER,
  ErrorCode,
  ErrorDescription,
} from 'common/errors';
import MainContent from './MainContent';
import { AquaProvider, useAquaContext } from './utils/AquaContext';
import SideBar from './SideBar';
import FrequencyResponseChart from './graph/FrequencyResponseChart';
import PresetsBar from './PresetsBar';
import AutoEQ from './AutoEQ';
import {
  deletePreset,
  getPresetListFromFiles,
  loadPreset,
  renamePreset,
  savePreset,
  updateConfigFilePath,
} from './utils/equalizerApi';
import Modal from './widgets/Modal';
import FilePicker from './widgets/FilePicker';
import IconButton, { IconName } from './widgets/IconButton';
import ConfirmationModal from './widgets/ConfirmationModal';

export const AppContent = () => {
  const {
    isLoading,
    isGraphViewOn,
    globalError,
    configFilePath,
    performHealthCheck,
    setConfigFilePath,
    setGlobalError,
  } = useAquaContext();

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleChangeConfigFile = useCallback(
    async (file: File) => {
      if (!file) {
        return;
      }

      try {
        await updateConfigFilePath(file.path);
        setConfigFilePath(file.path);
        performHealthCheck();
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
    },
    [setConfigFilePath, performHealthCheck, setGlobalError]
  );

  const globalErrorModal = useMemo(() => {
    if (!globalError) {
      return undefined;
    }

    if (globalError.code === ErrorCode.CONFIG_NOT_FOUND) {
      return (
        <ConfirmationModal
          isLoading={isLoading}
          onSubmit={performHealthCheck}
          headerText={globalError.title}
          bodyText={`${globalError.shortError} ${globalError.action.replace(
            CONFIG_FILE_PATH_PLACEHOLDER,
            configFilePath
          )}`}
        >
          <FilePicker
            label="Select a config file"
            placeholder="No file selected."
            accept=".txt"
            isDisabled={isLoading}
            handleChange={handleChangeConfigFile}
          />
        </ConfirmationModal>
      );
    }
    return (
      <ConfirmationModal
        isLoading={isLoading}
        onSubmit={performHealthCheck}
        headerText={globalError.title}
        bodyText={`${globalError.shortError} ${globalError.action}`}
      />
    );
  }, [
    globalError,
    isLoading,
    performHealthCheck,
    configFilePath,
    handleChangeConfigFile,
  ]);

  const settingsModal = (
    <Modal
      className="settings-modal"
      onClose={() => setShowSettingsModal(false)}
      headerContent={<h1>Settings</h1>}
      bodyContent={
        <>
          <div className="label-l">Config File</div>
          <div className="row config-file-content">
            <div className="label-m">Current Path</div>
            <FilePicker
              label="Select a config file"
              placeholder={configFilePath}
              accept=".txt"
              isDisabled={isLoading}
              handleChange={handleChangeConfigFile}
            />
          </div>
        </>
      }
    />
  );

  return (
    <>
      <header className="title-bar row">
        <span className="brand">AQUA</span>
        <IconButton
          icon={IconName.GEAR}
          className="settings"
          handleClick={() => setShowSettingsModal(true)}
        />
      </header>
      <div className={`app ${isGraphViewOn ? '' : 'minimized'}`}>
        <SideBar />
        <div className="middle-content">
          <AutoEQ />
          <MainContent />
        </div>
        <PresetsBar
          fetchPresets={getPresetListFromFiles}
          loadPreset={loadPreset}
          savePreset={savePreset}
          renamePreset={renamePreset}
          deletePreset={deletePreset}
        />
        <FrequencyResponseChart />
        {showSettingsModal && settingsModal}
        {globalErrorModal}
      </div>
    </>
  );
};

export default function App() {
  return (
    <AquaProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppContent />} />
        </Routes>
      </Router>
    </AquaProvider>
  );
}
