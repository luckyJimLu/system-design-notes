# 第 18 章：谷歌地图

## 简介

我们将设计一个简单版本的 **Google 地图**。

关于谷歌地图的一些事实：
 * 2005年开始
 * 提供各种服务——卫星图像、街道地图、实时交通状况、路线规划
 * 到 2021 年，每日活跃用户数达 10 亿，全球覆盖率达 99%，每日更新实时位置信息 2500 万次

---

## 第 1 步：了解问题并确定设计范围

候选人和面试官之间的问答示例：
 * C：我们每天有多少活跃用户？
 * 我：10 亿日活跃用户
 * C：我们应该关注哪些特点？
 * I：位置更新、导航、ETA、地图渲染
 * C：道路数据有多大？我们可以访问它吗？
 * I：我们从各种来源获取了道路数据，这是数TB的原始数据
 * C：我们应该考虑交通状况吗？
 * I：是的，我们应该准确估计时间
 * C：不同的出行方式怎么样——步行、骑自行车、开车？
 * 我：我们应该支持那些
 * C：多站路线怎么样？
 * I：我们不要把重点放在采访范围上
 * C：营业地点和照片？
 * I：好问题，但没必要考虑这些

我们将重点关注三个关键功能 - 用户位置更新、导航服务（包括预计到达时间）、地图渲染。

### **非功能性需求**

- **准确性**：用户不应该得到错误的指示
- **平滑导航**：用户应该体验平滑的地图渲染
- **数据和电池使用**：客户应使用尽可能少的数据和电池。对于移动设备很重要。
- 一般可用性和可扩展性要求

### **地图101**

在开始设计之前，我们应该了解一些与地图相关的概念。

#### 定位系统

世界是一个球体，绕其轴旋转。位置由纬度（北/南有多远）和经度（东/西有多远）定义：

<div style="margin-left:3rem">
    <img src="./images/partitioning-system.png" alt="partitioning-system" width="500" />
</div>

#### 从 3D 到 2D

将点从 3D 平面转换到 2D 平面的过程称为“地图投影”。

有不同的方法可以做到这一点，每种方法都有其优点和缺点。几乎所有的都扭曲了实际的几何形状。

<div style="margin-left:3rem">
    <img src="./images/map-projections.png" alt="map-projections" width="500" />
</div>

Google 地图选择了墨卡托投影的修改版本，称为“Web 墨卡托”。

#### 地理编码

地理编码是将地址转换为地理坐标的过程。

相反的过程称为“反向地理编码”。

实现此目的的一种方法是使用插值 - 利用来自不同来源（例如 GIS-es）的数据，其中街道网络映射到地理坐标空间。

#### 地理哈希

Geohashing 是一种编码系统，它将地理区域编码为字母和数字字符串。

它将世界描绘成一个平坦的表面，并递归地将其细分为四个象限：

<div style="margin-left:3rem">
    <img src="./images/geohashing.png" alt="geohashing" width="500" />
</div>

#### 地图渲染

地图渲染通过平铺进行。世界被分解成更小的图块，而不是将整个地图渲染为一个大的自定义图像。

客户端只下载相关的图块并像拼接马赛克一样渲染它们。

不同的缩放级别有不同的图块。客户端根据客户端的缩放级别选择合适的图块。

例如，缩小整个世界只会下载一个 256x256 的图块，代表整个世界。

#### 用于导航算法的道路数据处理

在大多数路由算法中，交叉路口表示为节点，道路表示为边：

<div style="margin-left:3rem">
    <img src="./images/road-representation.png" alt="road-representation" width="500" />
</div>

大多数导航算法使用 Djikstra 或 A* 算法的修改版本。

寻路性能对图形的大小很敏感。为了大规模工作，我们无法将整个世界表示为图表并在其上运行算法。

相反，我们使用类似于平铺的技术 - 我们将世界细分为越来越小的图形。

路由图块保存对相邻图块的引用，算法可以在遍历互连图块时将更大的道路图缝合在一起：

<div style="margin-left:3rem">
    <img src="./images/routing-tiles.png" alt="routing-tiles" width="500" />
</div>

这项技术使我们能够显着减少内存带宽，并且仅加载给定源/目标对所需的图块。

然而，对于较大的路线，将小的、详细的路线图块拼接在一起仍然会消耗时间/内存。相反，存在具有不同详细程度的路由图块，并且算法根据我们要去的目的地使用适当详细的图块：

<div style="margin-left:3rem">
    <img src="./images/map-routing-hierarchical.png" alt="map-routing-hierarchical" width="500" />
</div>

### **粗略估计**

对于存储，我们需要存储：
 * 世界地图 - 根据我们需要存储的所有图块估计约为 70pb，但考虑到非常相似的图块的压缩（例如广阔的沙漠）
 * 元数据 - 大小可以忽略不计，因此我们可以在计算中跳过它
 * 道路信息 - 存储为路线图块

导航请求的估计 QPS - 每周使用 35 分钟时 10 亿 DAU -> 每天 50 亿分钟。
假设 GPS 更新请求是批量的，我们在峰值负载时达到 200k QPS 和 100 万 QPS

---

## 第 2 步：提出高级设计并获得认可

<div style="margin-left:3rem">
    <img src="./images/high-level-design.png" alt="high-level-design" width="500" />
</div>

### **定位服务**

<div style="margin-left:3rem">
    <img src="./images/location-service.png" alt="location-service" width="500" />
</div>

它负责记录用户的位置更新：
 * 位置更新每 `t` 秒发送一次
 * 位置数据流可用于随着时间的推移改进服务，例如提供更准确的预计到达时间、监控交通数据、检测封闭道路、分析用户行为等

我们可以在客户端批量更新并批量发送，而不是一直向服务器发送位置更新：

<div style="margin-left:3rem">
    <img src="./images/location-update-batches.png" alt="location-update-batches" width="500" />
</div>

尽管进行了这种优化，对于 Google 地图规模的系统来说，负载仍然很大。因此，我们可以利用针对重度写入进行优化的数据库，例如 Cassandra。

我们还可以利用 Kafka 进行位置更新的高效流处理，以便进一步分析。

位置更新请求负载示例：


```
POST /v1/locations
Parameters
  locs: JSON encoded array of (latitude, longitude, timestamp) tuples.
```


### **导航服务**

该组件负责在合理的时间内找到 A 和 B 之间的快速路由（一点点延迟是可以的）。路线不一定是最快的，但准确性很重要。

请求负载示例：


```
GET /v1/nav?origin=1355+market+street,SF&destination=Disneyland
```


响应示例：


```json
{
  "distance": {"text":"0.2 mi", "value": 259},
  "duration": {"text": "1 min", "value": 83},
  "end_location": {"lat": 37.4038943, "Ing": -121.9410454},
  "html_instructions": "Head <b>northeast</b> on <b>Brandon St</b> toward <b>Lumin Way</b><div style=\"font-size:0.9em\">Restricted usage road</div>",
  "polyline": {"points": "_fhcFjbhgVuAwDsCal"},
  "start_location": {"lat": 37.4027165, "lng": -121.9435809},
  "geocoded_waypoints": [
    {
       "geocoder_status" : "OK",
       "partial_match" : true,
       "place_id" : "ChIJwZNMti1fawwRO2aVVVX2yKg",
       "types" : [ "locality", "political" ]
    },
    {
       "geocoder_status" : "OK",
       "partial_match" : true,
       "place_id" : "ChIJ3aPgQGtXawwRLYeiBMUi7bM",
       "types" : [ "locality", "political" ]
    }
  ],
  "travel_mode": "DRIVING"
}
```


交通变化和路线变更尚未考虑在内，这些将在深入部分中解决。

### **地图渲染**

在客户端保存整个地图切片数据集是不可行的，因为它的大小为 PB。

它们需要根据客户端的位置和缩放级别从服务器按需获取。

何时应该获取新图块 - 当用户放大/缩小以及导航期间，当他们走向新图块时。

应如何向客户提供地图图块？
 * 它们可以动态构建，但这会给服务器带来巨大的负载，也使缓存变得困难
 * 地图图块是根据客户端可以计算的地理哈希值静态提供的。它们可以静态存储并通过 CDN 提供服务

<div style="margin-left:3rem">
    <img src="./images/static-map-tiles.png" alt="static-map-tiles" width="500" />
</div>

CDN 使用户能够从距离用户最近的存在点服务器 (POP) 获取地图图块，以最大程度地减少延迟：

<div style="margin-left:3rem">
    <img src="./images/cdn-vs-no-cdn.png" alt="cdn-vs-no-cdn" width="500" />
</div>

确定地图图块时要考虑的选项：
 * 地图瓦片的geohash可以在客户端计算。如果是这种情况，我们应该小心，长期致力于这种类型的地图图块计算，因为强制客户端更新很困难
 * 或者，我们可以使用简单的 API，代表客户端计算地图图块 URL，但需要额外的 API 调用

<div style="margin-left:3rem">
    <img src="./images/map-tile-url-calculation.png" alt="map-tile-url-calculation" width="500" />
</div>

---

## 第 3 步：深入设计

### **数据模型**

让我们讨论一下如何存储我们正在处理的不同类型的数据。

#### 布线块

初始道路数据集是从不同来源获得的。它会根据位置更新数据随着时间的推移而得到改进。

道路数据是非结构化的。我们有一个定期的离线处理管道，它将这些原始数据转换为我们的应用程序所需的基于图形的路由图块。

而不是将这些图块存储在数据库中，因为我们不需要任何数据库功能。我们可以将它们存储在 S3 对象存储中，同时积极缓存它们。

我们还可以利用库将邻接列表有效地压缩为二进制文件。

#### 用户位置数据

用户位置数据对于更新交通状况和进行各种其他分析非常有用。

我们可以使用 Cassandra 来存储此类数据，因为它的本质是写入量大。

示例行：

<div style="margin-left:3rem">
    <img src="./images/user-location-data-torw.png" alt="user-location-data-row" width="500" />
</div>

#### 地理编码数据库

该数据库存储纬度/经度对和地点的键值对。

我们可以使用Redis，因为它的读取访问速度快，因为我们有频繁的读取和不频繁的写入。

#### 预先计算的世界地图图像

正如我们所讨论的，我们将预先计算地图切片图像并将其存储在 CDN 中。

<div style="margin-left:3rem">
    <img src="./images/precomputed-map-tile-image.png" alt="precomputed-map-tile-image" width="500" />
</div>

### **服务**

#### 定位服务

让我们重点关注数据库设计以及如何详细存储该服务的用户位置。

<div style="margin-left:3rem">
    <img src="./images/location-service-diagram.png" alt="location-service-diagram" width="500" />
</div>

我们可以使用 NoSQL 数据库来缓解位置更新方面的繁重写入负载。我们优先考虑可用性而不是一致性，因为用户位置数据经常发生变化，并且随着新更新的到来而变得陈旧。

我们将选择 Cassandra 作为我们的数据库选择，因为它非常适合我们的所有要求。

我们要存储的示例行：

<div style="margin-left:3rem">
    <img src="./images/user-location-row-example.png" alt="user-location-row-example" width="500" />
</div>

 * `user_id` 是分区键，用于快速访问特定用户的所有位置更新
 * `timestamp` 是聚类键，用于存储按接收位置更新时间排序的数据

我们还利用 Kafka 将位置更新流式传输到各种其他服务，这些服务出于各种目的需要位置更新：

<div style="margin-left:3rem">
    <img src="./images/location-update-streaming.png" alt="location-update-streaming" width="500" />
</div>

#### 渲染图

地图图块以不同的缩放级别存储。在最低缩放级别，整个世界由一个 256x256 的图块表示。

随着缩放级别的增加，地图图块的数量会增加四倍：

<div style="margin-left:3rem">
    <img src="./images/zoom-level-increases.png" alt="zoom-level-increases" width="500" />
</div>

我们可以使用的一种优化是不通过网络发送整个图像信息，而是将图块表示为矢量（路径和多边形）并让客户端动态渲染图块。

这将节省大量带宽。

#### 导航服务

该服务负责查找最快的路线：

<div style="margin-left:3rem">
    <img src="./images/navigation-service.png" alt="navigation-service" width="500" />
</div>

让我们详细了解一下该子系统中的每个组件。

首先，我们有地理编码服务，它将地址解析为纬度/经度对的位置。

请求示例：


```
https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA
```


响应示例：


```json
{
   "results" : [
      {
         "formatted_address" : "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA",
         "geometry" : {
            "location" : {
               "lat" : 37.4224764,
               "lng" : -122.0842499
            },
            "location_type" : "ROOFTOP",
            "viewport" : {
               "northeast" : {
                  "lat" : 37.4238253802915,
                  "lng" : -122.0829009197085
               },
               "southwest" : {
                  "lat" : 37.4211274197085,
                  "lng" : -122.0855988802915
               }
            }
         },
         "place_id" : "ChIJ2eUgeAK6j4ARbn5u_wAGqWA",
         "plus_code": {
            "compound_code": "CWC8+W5 Mountain View, California, United States",
            "global_code": "849VCWC8+W5"
         },
         "types" : [ "street_address" ]
      }
   ],
   "status" : "OK"
}
```


路线规划器服务计算建议路线，并根据当前交通状况优化旅行时间。

最短路径服务针对对象存储中的路由块运行 A* 算法的变体来计算最佳路径：
 * 它接收源/目的地对，将它们转换为纬度/经度对，并从这些对中导出地理哈希值以导出路由图块
 * 该算法从初始路由图块开始并开始遍历它，直到找到到达目标图块的足够好的路径

<div style="margin-left:3rem">
    <img src="./images/shortest-path-service.png" alt="shortest-path-service" width="500" />
</div>

ETA 服务由路线规划器调用，根据机器学习算法获取预计时间，并根据交通数据预测 ETA。

排名器服务负责根据用户通过的过滤器（即避开收费公路或高速公路的标志）对不同的可能路径进行排名。

更新程序服务异步更新一些重要数据库以使其保持最新状态。

#### 改进 - 自适应预计到达时间和重新路由

我们可以做的一项改进是根据新的可用交通数据自适应地更新飞行路线。

实现此目的的一种方法是通过存储用户应该经过的所有图块来存储当前正在数据库中导航的路线的用户。

数据可能如下所示：


```
user_1: r_1, r_2, r_3, …, r_k
user_2: r_4, r_6, r_9, …, r_n
user_3: r_2, r_8, r_9, …, r_m
...
user_n: r_2, r_10, r21, ..., r_l
```


如果某个图块上发生交通事故，我们可以识别路径经过该图块的所有用户并重新路由他们。

为了减少我们在数据库中存储的切片数量，我们可以存储原始路由切片和不同分辨率级别的多个路由切片，直到目标切片也包含在内：


```
user_1, r_1, super(r_1), super(super(r_1)), ...
```


<div style="margin-left:3rem">
    <img src="./images/adaptive-eta-data-storage.png" alt="adaptive-eta-data-storage" width="500" />
</div>

使用此功能，我们只需检查用户的最终图块是否包含交通事故图块即可确定用户是否受到影响。

我们还可以跟踪导航用户的所有可能路线，并通知他们是否有更快的重新路线。

#### 交付协议

我们有多种选择，使我们能够主动将数据从服务器推送到客户端：
 * 移动推送通知不起作用，因为有效负载有限并且不适用于网络应用程序
 * WebSocket 通常是比长轮询更好的选择，因为它在服务器上的计算占用更少
 * 我们还可以使用服务器发送事件（SSE），但倾向于 Web 套接字，因为它们支持双向通信，这可以派上用场，例如最后一英里的交付功能

---

## 第四步：总结

这是我们最终的设计：

<div style="margin-left:3rem">
    <img src="./images/final-design.png" alt="final-design" width="500" />
</div>

我们可以提供的另一个功能是多站导航，可以将其出售给 Uber 或 Lyft 等企业客户，以确定访问一组位置的最佳路径。
