<script>
  import Icon from './icon.svelte'
  import logoIcon from '@/images/logo-stroke.svg'
</script>

<h1>
  <Icon class="icon-logo" svg={logoIcon} />
  Agent Workspace Reader
</h1>

<style>
  h1 {
    display: flex;
    align-items: center;
    padding: 0 0 22px;
    margin: 0;
    font-size: 18px;
    color: #35363a;
  }
  h1 :global(.icon-logo) {
    width: 22px;
    height: 22px;
    margin-right: 6px;
  }
</style>
