import { useEffect, useMemo, useRef, useState } from 'react';
import './styles/PresetsBar.scss';
import { useAquaContext } from './utils/AquaContext';
import TextInput from './widgets/TextInput';
import Button from './widgets/Button';
import List, { IOptionEntry } from './widgets/List';
import IconButton, { IconName } from './widgets/IconButton';
import { useClickOutside, useFocusOut } from './utils/utils';

interface IListItemProps {
  value: string;
  handleChange: (newValue: string) => void;
  handleDelete: (value: string) => void;
  isDisabled: boolean;
}

// TODO: move this component to a new file
// TODO: add logic to show icons on hover
const PresetListItem = ({
  value,
  handleChange,
  handleDelete,
  isDisabled,
}: IListItemProps) => {
  const editModeRef = useRef<HTMLInputElement>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Close edit mode if the user clicks outside of the input
  useClickOutside<HTMLInputElement>(editModeRef, () => {
    setIsEditMode(false);
  });

  // Close edit mode if the user tabs outside of the input
  useFocusOut<HTMLInputElement>(editModeRef, () => {
    setIsEditMode(false);
  });

  const handleEditClicked = () => {
    setIsEditMode(true);
  };

  const handleDeleteClicked = () => {
    handleDelete(value);
  };

  const handleInputChange = (newValue: string) => {
    handleChange(newValue);
    setIsEditMode(false);
  };

  return (
    <div className="row presetListItem">
      {isEditMode ? (
        <TextInput
          ref={editModeRef}
          value={value}
          ariaLabel="Edit Preset Name"
          isDisabled={false}
          handleChange={handleInputChange}
        />
      ) : (
        <>
          {value}
          <div className="row icons">
            <IconButton
              icon={IconName.EDIT}
              handleClick={handleEditClicked}
              isDisabled={isDisabled}
            />
            <IconButton
              icon={IconName.DELETE}
              handleClick={handleDeleteClicked}
              isDisabled={isDisabled}
            />
          </div>
        </>
      )}
    </div>
  );
};

const PresetsBar = () => {
  const { globalError } = useAquaContext();

  const [presetName, setPresetName] = useState<string>('');
  const [selectedPresetName, setSelectedPresetName] = useState<
    string | undefined
  >(undefined);

  const handleCreatePreset = () => {
    // TODO: add code for creating a preset
    setSelectedPresetName(presetName);
  };

  const handleLoadPreset = () => {
    // TODO: add code for loading a preset
  };

  const handleChangeNewPresetName = (newValue: string) => {
    setPresetName(newValue);

    // TODO: If the preset name is an existing one, we should set the selected one to be that so we can load it
    setSelectedPresetName(undefined);
  };

  const handleChangeSelectedPreset = (newValue: string) => {
    setPresetName(newValue);
    setSelectedPresetName(newValue);
  };

  const [presetNames, setPresetNames] = useState<string[]>([
    'Bass Boost',
    'Classic',
    'Dance',
  ]);

  const options: IOptionEntry[] = useMemo(() => {
    const handleEditExistingPresetName = (
      oldValue: string,
      newValue: string
    ) => {
      console.log('edit');
      // TODO: improve DS to help check if the newValue is an existing preset
      setPresetNames(presetNames.map((n) => (n === oldValue ? newValue : n)));
    };

    const handleDeletePreset = (deletedValue: string) => {
      console.log('delete');
      setPresetNames(presetNames.filter((n) => n !== deletedValue));
    };

    return presetNames.map((n) => {
      return {
        value: n,
        label: n,
        display: (
          <PresetListItem
            value={n}
            handleChange={(newValue: string) =>
              handleEditExistingPresetName(n, newValue)
            }
            handleDelete={handleDeletePreset}
            isDisabled={!!globalError}
          />
        ),
      };
    });
  }, [globalError, presetNames]);

  return (
    <div className="col presetsBar center">
      <h4>Preset Menu</h4>
      <div className="row center">
        Name:&nbsp;
        <TextInput
          value={presetName}
          ariaLabel="Preset Name"
          isDisabled={!!globalError}
          handleChange={handleChangeNewPresetName}
        />
      </div>
      <Button
        ariaLabel="Save settings to preset"
        className="small full"
        isDisabled={!!globalError}
        handleChange={handleCreatePreset}
      >
        Save current settings to preset
      </Button>
      <List
        name="preset"
        options={options}
        className="full"
        value={presetName}
        handleChange={handleChangeSelectedPreset}
        isDisabled={!!globalError}
      />
      <Button
        ariaLabel="Load selected preset"
        className="small full"
        isDisabled={!!globalError || !selectedPresetName}
        handleChange={handleLoadPreset}
      >
        Load selected preset
      </Button>
    </div>
  );
};

export default PresetsBar;