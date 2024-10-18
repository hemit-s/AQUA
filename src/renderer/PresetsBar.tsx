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

import {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import './styles/PresetsBar.scss';
import { ErrorDescription } from 'common/errors';
import { isRestrictedPresetName } from 'common/utils';
import { useAquaContext } from './utils/AquaContext';
import TextInput from './widgets/TextInput';
import Button from './widgets/Button';
import List, { IOptionEntry } from './widgets/List';
import PresetListItem from './components/PresetListItem';
import { formatPresetName } from './utils/utils';

export enum PresetErrorEnum {
  EMPTY = 'Preset name cannot be empty.',
  RESTRICTED = 'Invalid preset name, please use another.',
  DUPLICATE = 'Duplicate name found, please use another.',
}

export enum PresetActionEnum {
  INIT,
  CREATE,
  DELETE,
  RENAME,
}

export type PresetAction =
  | { type: PresetActionEnum.INIT; presetNames: string[] }
  | { type: PresetActionEnum.CREATE; presetName: string }
  | { type: PresetActionEnum.DELETE; presetName: string }
  | { type: PresetActionEnum.RENAME; oldName: string; newName: string };

type IPresetReducer = (presetNames: string[], action: PresetAction) => string[];

const presetReducer: IPresetReducer = (
  presetNames: string[],
  action: PresetAction
) => {
  switch (action.type) {
    case PresetActionEnum.INIT:
      return action.presetNames.sort();
    case PresetActionEnum.CREATE:
      return [...presetNames, action.presetName].sort();
    case PresetActionEnum.DELETE:
      return presetNames.filter((name) => name !== action.presetName);
    case PresetActionEnum.RENAME:
      return presetNames.map((name) =>
        name === action.oldName ? action.newName : name
      );
    default:
      // This throw does not actually do anything because
      // we are in a reducer
      throw new Error('Unhandled action type should not occur');
  }
};

interface IPresetsBarProps {
  fetchPresets: () => Promise<string[]>;
  loadPreset: (presetName: string) => Promise<void>;
  savePreset: (presetName: string) => Promise<void>;
  renamePreset: (oldName: string, newName: string) => Promise<void>;
  deletePreset: (presetName: string) => Promise<void>;
  importPreset: () => Promise<void>;
  exportPreset: (presetName: string) => Promise<void>;
}

const PresetsBar = ({
  fetchPresets,
  loadPreset,
  savePreset,
  renamePreset,
  deletePreset,
  importPreset,
  exportPreset,
}: IPresetsBarProps) => {
  const { globalError, isCaseSensitiveFs, performHealthCheck, setGlobalError } =
    useAquaContext();

  const [presetName, setPresetName] = useState<string>('');
  const [newPresetNameError, setNewPresetNameError] = useState<string>('');
  const [ioPending, setIoPending] = useState<boolean>(false);
  const [presetNames, dispatchPresetNames] = useReducer<IPresetReducer>(
    presetReducer,
    []
  );

  const isExistingPresetSelected = useMemo(
    () => presetNames.some((n) => n === presetName),
    [presetName, presetNames]
  );

  // Fetch default presets and custom presets from storage
  useEffect(() => {
    const fetchPresetNames = async () => {
      try {
        const result = await fetchPresets();
        dispatchPresetNames({
          type: PresetActionEnum.INIT,
          presetNames: result,
        });
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
    };

    fetchPresetNames();
  }, [fetchPresets, setGlobalError]);

  // Creating a new preset
  const handleCreateOrSavePreset = useCallback(async () => {
    // Do not create or save a preset if there is no name or if there is an error present
    if (!presetName || newPresetNameError) {
      return;
    }

    try {
      await savePreset(presetName);

      // If we are creating a new preset and not just updating an existing one, update the list of preset names
      if (!isExistingPresetSelected) {
        dispatchPresetNames({
          type: PresetActionEnum.CREATE,
          presetName,
        });
      }
    } catch (e) {
      setGlobalError(e as ErrorDescription);
    }
  }, [
    isExistingPresetSelected,
    newPresetNameError,
    presetName,
    savePreset,
    setGlobalError,
  ]);

  // Loading audio settings from an existing preset
  const handleLoadPreset = async () => {
    if (isExistingPresetSelected) {
      try {
        await loadPreset(presetName);
        performHealthCheck();
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
    }
  };

  // Import audio settings from an EqualizerAPO preset file
  const handleImportPreset = async () => {
    setIoPending(true);
    try {
      await importPreset();
      performHealthCheck();
    } catch (e) {
      setGlobalError(e as ErrorDescription);
    }
    setIoPending(false);
  };

  // Export audio settings to an EqualizerAPO preset file
  const handleExportPreset = async () => {
    if (isExistingPresetSelected) {
      setIoPending(true);
      try {
        await exportPreset(presetName);
        performHealthCheck();
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
      setIoPending(false);
    }
  };

  // Validating a new preset name
  const validatePresetName = useCallback((newValue: string) => {
    if (isRestrictedPresetName(newValue)) {
      return PresetErrorEnum.RESTRICTED;
    }

    return '';
  }, []);

  const validatePresetNew = useCallback(
    (newName: string) => {
      /**
       * For a not case sensitive file system (apple is equal to ApPlE), we want to prevent users from creating a new preset
       * that has the same characters that differ only in case. However, we want to allow users to specify an exact duplicate
       * (where the characters and the case both match) so they can overwrite their existing presets.
       */
      if (
        !isCaseSensitiveFs &&
        presetNames.some(
          (existingName) =>
            newName.toLocaleLowerCase() === existingName.toLocaleLowerCase() &&
            existingName !== newName
        )
      ) {
        return PresetErrorEnum.DUPLICATE;
      }
      return validatePresetName(newName);
    },
    [isCaseSensitiveFs, presetNames, validatePresetName]
  );

  // Validating a preset rename
  const validatePresetRename = useCallback(
    (oldName: string) => (newName: string) => {
      if (!newName) {
        return PresetErrorEnum.EMPTY;
      }

      /**
       *  Should cover the following cases for duplicate detection and case sensitivity:
       *   - rename "apple" to "Apple" -> Case Insensitive: allowed, Case Sensitive: allowed
       *   - rename "banana" to "Apple" when another "apple" preset exists -> Case Insensitive: DUPLICATE, Case Sensitive: allowed
       */
      if (
        isCaseSensitiveFs
          ? presetNames.some(
              (existingName) =>
                existingName !== oldName && existingName === newName
            )
          : presetNames.some(
              (existingName) =>
                existingName !== oldName &&
                existingName.toLocaleLowerCase() === newName.toLocaleLowerCase()
            )
      ) {
        return PresetErrorEnum.DUPLICATE;
      }

      return validatePresetName(newName);
    },
    [isCaseSensitiveFs, presetNames, validatePresetName]
  );

  const handleChangeNewPresetName = (newValue: string) => {
    setPresetName(newValue);

    // Validate new preset name and update error message accordingly
    const msg = validatePresetNew(newValue);
    setNewPresetNameError(msg);
  };

  // Changing the selected preset in the UI
  const handleChangeSelectedPreset = (newValue: string, e?: MouseEvent) => {
    setPresetName(newValue);

    // Load preset when it is double clicked
    if (e?.detail === 2) {
      handleLoadPreset();
    }
  };

  // Deleting a preset
  const handleDeletePreset = useCallback(
    (deletedValue: string) => async () => {
      try {
        await deletePreset(deletedValue);
        dispatchPresetNames({
          type: PresetActionEnum.DELETE,
          presetName: deletedValue,
        });

        // Deselect preset name info since the preset no longer exists
        setPresetName('');
      } catch (e) {
        // continue to run, the worst case is that the file still exists and that's all.
      }
    },
    [deletePreset]
  );

  // Renaming an existing preset
  const handleRenameExistingPresetName = useCallback(
    (oldName: string) => async (newName: string) => {
      try {
        await renamePreset(oldName, newName);
        dispatchPresetNames({
          type: PresetActionEnum.RENAME,
          oldName,
          newName,
        });

        // Update preset name to reflect updated value
        setPresetName(newName);
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
    },
    [renamePreset, setGlobalError]
  );

  const options: IOptionEntry[] = useMemo(() => {
    return presetNames.map((n) => {
      return {
        value: n,
        label: n,
        display: (
          <PresetListItem
            value={n}
            handleRename={handleRenameExistingPresetName(n)}
            handleDelete={handleDeletePreset(n)}
            isDisabled={!!globalError}
            validate={validatePresetRename(n)}
          />
        ),
      };
    });
  }, [
    validatePresetRename,
    globalError,
    handleDeletePreset,
    handleRenameExistingPresetName,
    presetNames,
  ]);

  return (
    <div className="presets-bar">
      <h4>Preset Menu</h4>
      <div className="row">
        <div className="preset-name">Name:</div>
        <TextInput
          value={presetName}
          ariaLabel="Preset Name"
          isDisabled={!!globalError}
          errorMessage={newPresetNameError}
          handleChange={handleChangeNewPresetName}
          handleSubmit={handleCreateOrSavePreset}
          formatInput={formatPresetName}
        />
      </div>
      <Button
        ariaLabel="Save settings to preset"
        className="small"
        isDisabled={!!globalError || !presetName || !!newPresetNameError}
        handleChange={handleCreateOrSavePreset}
      >
        Save current settings to preset
      </Button>
      <List
        name="preset"
        options={options}
        itemClassName="preset-list-item"
        value={presetName}
        handleChange={handleChangeSelectedPreset}
        isDisabled={!!globalError}
        emptyOptionsPlaceholder="No presets found."
      />
      <Button
        ariaLabel="Load selected preset"
        className="small"
        isDisabled={!!globalError || !isExistingPresetSelected}
        handleChange={handleLoadPreset}
      >
        Load selected preset
      </Button>
      <div className="row">
        <Button
          ariaLabel="Import preset"
          className="small"
          isDisabled={!!globalError || ioPending}
          handleChange={handleImportPreset}
        >
          Import Preset
        </Button>
        <Button
          ariaLabel="Export preset"
          className="small"
          isDisabled={!!globalError || !isExistingPresetSelected || ioPending}
          handleChange={handleExportPreset}
        >
          Export Preset
        </Button>
      </div>
    </div>
  );
};

export default PresetsBar;
