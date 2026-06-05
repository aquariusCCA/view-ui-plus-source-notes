<template>
  <div id="app" class="container">
        <div class="container-nav">
          <span><router-link to="/icon">Icon</router-link></span>
        </div>
        <div style="margin: 50px">
            <router-view></router-view>
        </div>
  </div>
</template>

<style lang="less" scoped>
.container-nav{
    &>span{
        display: inline-block;
        margin-right: 12px;
    }
}
</style>