<script lang="ts">
  import storage from '@/core/storage'
  import Warning from './warning.svelte'
  import Header from './header.svelte'
  import Radio from '@smui/radio'
  import Switch from '@smui/switch'
  import FormField from '@smui/form-field'
  import Select, { Option } from '@smui/select'
  import Chip, { Set, Text } from '@smui/chips'
  import MD_PLUGINS from '@/config/md-plugins'
  import PAGE_THEMES from '@/config/page-themes'
  import { MERMAID_LAYOUTS, MERMAID_LOOKS } from '@/config/mermaid-options'
  import { getDefaultData, type Data } from '@/core/data'
  import { normalizeFolderRootURL } from '@/core/folder'
  import i18n from '@/config/i18n'

  let localize = i18n()
  let isAllowViewFile = true
  let data = getDefaultData()

  // Get if file allowed access
  chrome.extension.isAllowedFileSchemeAccess(
    (isAllow: boolean) => (isAllowViewFile = !!isAllow),
  )

  storage.get().then((_data: Data) => {
    // need an assignment to updata UI
    data = { ...data, ..._data, language: i18n(_data.language).locale }
  })

  $: if (data.language) {
    updateConfig('language', data.language)
    changeLocale(data.language)
  }

  function updateConfig(key, value) {
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'storage', data: { key, value } })
    }, 0)
  }

  function changeLocale(language) {
    localize = i18n(language)
  }

  function updateFolderRootPath() {
    data.folderRootPath = data.folderRootPath?.trim() || ''
    updateConfig('folderRootPath', data.folderRootPath)
  }

  // Opens the root folder, where the page asks the browser's folder dialog:
  // the popup can't grant on the pages' behalf.
  function grantWrite() {
    const rootURL = normalizeFolderRootURL(data.folderRootPath)
    if (!rootURL) return
    chrome.tabs.create({ url: `${rootURL}?grant=write` })
  }

  function forgetWrite() {
    const rootURL = normalizeFolderRootURL(data.folderRootPath)
    data.writeRoots = []
    updateConfig('writeRoots', [])
    if (rootURL) chrome.tabs.create({ url: `${rootURL}?grant=forget` })
  }

  function reloadExtension() {
    chrome.runtime.sendMessage({ action: 'reloadExtension' })
    window.close()
  }

  function displayPath(url: string): string {
    try {
      const path = decodeURIComponent(new URL(url).pathname).replace(/\/$/, '')
      return /^\/[a-z]:/i.test(path) ? path.slice(1).replace(/\//g, '\\') : path
    } catch {
      return url
    }
  }

  $: writeRoots = data.writeRoots ?? []
</script>

<main>
  <Header />

  {#if !isAllowViewFile}
    <Warning {localize} />
  {/if}

  <div class="form" disabled={!data.enable}>
    <div class="form-item inline">
      <span class="label-item">{localize('label_enable')}:</span>
      <FormField align="end">
        <Switch
          bind:checked={data.enable}
          color="primary"
          on:change={() => updateConfig('enable', data.enable)}
        />
      </FormField>
    </div>

    <div class="form-item inline">
      <span class="label-item">{localize('label_centered')}:</span>
      <FormField align="end">
        <Switch
          disabled={!data.enable}
          bind:checked={data.centered}
          color="primary"
          on:change={() => updateConfig('centered', data.centered)}
        />
      </FormField>
    </div>

    <div class="form-item inline">
      <span class="label-item" title={localize('hint_github-compat')}
        >{localize('label_github-compat')}:</span
      >
      <FormField align="end">
        <Switch
          disabled={!data.enable}
          bind:checked={data.githubCompat}
          color="primary"
          on:change={() => updateConfig('githubCompat', data.githubCompat)}
        />
      </FormField>
    </div>

    <div class="form-item inline">
      <span class="label-item">{localize('label_auto-refresh')}:</span>
      <FormField align="end">
        <Switch
          disabled={!data.enable}
          bind:checked={data.refresh}
          color="primary"
          on:change={() => updateConfig('refresh', data.refresh)}
        />
      </FormField>
    </div>

    <div class="form-item inline">
      <span class="label-item">{localize('label_show-extensions')}:</span>
      <FormField align="end">
        <Switch
          disabled={!data.enable}
          bind:checked={data.showExtensions}
          color="primary"
          on:change={() => updateConfig('showExtensions', data.showExtensions)}
        />
      </FormField>
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_folder-root')}:</div>
      <input
        class="path-input"
        disabled={!data.enable}
        bind:value={data.folderRootPath}
        placeholder={localize('placeholder_folder-root')}
        on:change={updateFolderRootPath}
        on:keydown={event => event.key === 'Enter' && updateFolderRootPath()}
      />
      <div class="help-item">{localize('help_folder-root')}</div>
    </div>

    <div class="form-item inline">
      <span class="label-item">{localize('label_editing')}:</span>
      <FormField align="end">
        <Switch
          disabled={!data.enable}
          bind:checked={data.editing}
          color="primary"
          on:change={() => updateConfig('editing', data.editing)}
        />
      </FormField>
    </div>
    <div class="form-item editing-section">
      <div class="help-item">{localize('hint_editing')}</div>
      {#if data.editing}
        <button
          class="grant-button"
          type="button"
          disabled={!data.enable || !normalizeFolderRootURL(data.folderRootPath)}
          on:click={grantWrite}
        >
          {localize('label_grant-write')}
        </button>
        <div class="help-item">{localize('help_grant-write')}</div>
        <div class="help-item grant-status">
          {#if writeRoots.length}
            {localize('grant_status')}
            <ul class="grant-list">
              {#each writeRoots as root}
                <li>{displayPath(root)}</li>
              {/each}
            </ul>
          {/if}
          <button
            class="forget-button"
            type="button"
            disabled={!data.enable || !normalizeFolderRootURL(data.folderRootPath)}
            title={localize('title_forget-write')}
            on:click={forgetWrite}
          >
            {localize('label_forget-write')}
          </button>
        </div>
      {/if}
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_md-plugins')}:</div>
      <Set
        let:chip
        bind:selected={data.mdPlugins}
        chips={MD_PLUGINS}
        nonInteractive={!data.enable}
        filter={data.enable}
      >
        <Chip
          {chip}
          title={chip}
          on:click={() =>
            data.enable && updateConfig('mdPlugins', data.mdPlugins)}
          ><Text>{localize(chip)}</Text></Chip
        >
      </Set>
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_theme')}:</div>
      {#each PAGE_THEMES as mode}
        <FormField>
          <span slot="label"> {localize(mode)} </span>
          <Radio
            disabled={!data.enable}
            bind:group={data.pageTheme}
            bind:value={mode}
            on:change={() => updateConfig('pageTheme', mode)}
          />
        </FormField>
      {/each}
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_mermaid-look')}:</div>
      {#if data.githubCompat}
        <div class="hint">{localize('hint_mermaid-github')}</div>
      {/if}
      {#each MERMAID_LOOKS as look}
        <FormField>
          <span slot="label"> {localize(`mermaid_look_${look}`)} </span>
          <Radio
            disabled={!data.enable ||
              data.githubCompat ||
              !data.mdPlugins.includes('Mermaid')}
            bind:group={data.mermaidLook}
            bind:value={look}
            on:change={() => updateConfig('mermaidLook', look)}
          />
        </FormField>
      {/each}
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_mermaid-layout')}:</div>
      {#each MERMAID_LAYOUTS as layout}
        <FormField>
          <span slot="label"> {localize(`mermaid_layout_${layout}`)} </span>
          <Radio
            disabled={!data.enable ||
              data.githubCompat ||
              !data.mdPlugins.includes('Mermaid')}
            bind:group={data.mermaidLayout}
            bind:value={layout}
            on:change={() => updateConfig('mermaidLayout', layout)}
          />
        </FormField>
      {/each}
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_language')}:</div>
      <FormField style="padding-left: 10px">
        <Select bind:value={data.language}>
          {#each i18n.locales as locale}
            <Option value={locale}>{localize(locale)}</Option>
          {/each}
        </Select>
      </FormField>
    </div>

    <div class="form-item">
      <button class="grant-button" type="button" on:click={reloadExtension}>
        {localize('label_reload-extension')}
      </button>
      <div class="help-item">{localize('help_reload-extension')}</div>
    </div>
  </div>
</main>

<style>
  main {
    overflow: auto;
    box-sizing: border-box;
    width: 360px;
    max-height: 599px;
    padding: 22px 24px 10px;
    border: 1px solid #24315870;
    border-radius: 1px;
  }
  .form-item {
    margin-bottom: 6px;
  }
  .form-item.inline {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  .hint {
    font-size: 12px;
    color: #24315899;
  }
  .label-item {
    font-weight: bolder;
    font-size: 13px;
    color: #243158e3;
  }
  .path-input {
    box-sizing: border-box;
    width: 100%;
    margin-top: 7px;
    padding: 7px 8px;
    border: 1px solid #24315870;
    border-radius: 4px;
    font-size: 12px;
  }
  .path-input:focus {
    border-color: var(--mdc-theme-primary);
    outline: none;
  }
  .help-item {
    margin-top: 4px;
    color: #24315899;
    font-size: 11px;
    line-height: 1.4;
  }
  .editing-section {
    margin-top: -8px;
  }
  .grant-button {
    margin-top: 8px;
    padding: 6px 10px;
    border: 1px solid var(--mdc-theme-primary);
    border-radius: 4px;
    background: #fff;
    color: var(--mdc-theme-primary);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .grant-button:hover:not(:disabled) {
    background: #607cd21a;
  }
  .grant-button:disabled {
    border-color: #24315840;
    color: #24315870;
    cursor: default;
  }
  .grant-status {
    color: #243158e3;
    word-break: break-all;
  }
  .grant-list {
    margin: 2px 0 4px;
    padding-left: 16px;
  }
  .grant-list li {
    margin: 1px 0;
  }
  .forget-button {
    margin-top: 6px;
    padding: 5px 10px;
    border: 1px solid #ff6767;
    border-radius: 4px;
    background: #fff;
    color: #d64545;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .forget-button:hover:not(:disabled) {
    background: #ff67671a;
  }
  .forget-button:disabled {
    border-color: #24315840;
    color: #24315870;
    cursor: default;
  }
</style>
