
      document.addEventListener("DOMContentLoaded", () => {
        // Dữ liệu các ga và khoảng cách (tính từ Hà Nội)
        const stations = {
          Hanoi: { name: "Hà Nội", distance: 0 },
          Vinh: { name: "Vinh", distance: 319 },
          DaNang: { name: "Đà Nẵng", distance: 791 },
          NhaTrang: { name: "Nha Trang", distance: 1315 },
          HCM: { name: "TP. Hồ Chí Minh", distance: 1726 },
        };

        // Tốc độ của hai loại tàu (km/h)
        const speeds = {
          hightech: 350,
          traditional: 60,
        };

        // Lấy các phần tử DOM
        const startStationSelect = document.getElementById("start-station");
        const endStationSelect = document.getElementById("end-station");
        const compareBtn = document.getElementById("compare-btn");
        const resultsContainer = document.getElementById("results-container");
        const hightechTimeSpan = document.getElementById("hightech-time");
        const traditionalTimeSpan = document.getElementById("traditional-time");
        const timeSavedSpan = document.getElementById("time-saved");
        const hightechProgressDiv =
          document.getElementById("hightech-progress");

        // Thêm tọa độ các ga (lat, lng)
        const stationCoords = {
          Hanoi: [21.0285, 105.8542],
          Vinh: [18.6822, 105.6814],
          DaNang: [16.0678, 108.2208],
          NhaTrang: [12.2451, 109.1943],
          HCM: [10.7769, 106.7009],
        };

        let map,
          routeLine,
          markers = [];

        // Hàm khởi tạo bản đồ và marker các ga lớn

        // Không cho phép chọn trùng ga
        startStationSelect.addEventListener("change", () => {
          const startVal = startStationSelect.value;
          Array.from(endStationSelect.options).forEach((opt) => {
            opt.disabled = opt.value === startVal;
          });
        });
        endStationSelect.addEventListener("change", () => {
          const endVal = endStationSelect.value;
          Array.from(startStationSelect.options).forEach((opt) => {
            opt.disabled = opt.value === endVal;
          });
        });

        // Tuyến đường thực tế (ví dụ, có thể thêm nhiều điểm hơn cho cong mượt)
        const realRoute = [
          [21.0285, 105.8542], // Hà Nội
          [20.5, 105.8],
          [19.8, 105.7],
          [18.6822, 105.6814], // Vinh
          [17.5, 106.3],
          [16.0678, 108.2208], // Đà Nẵng
          [14.5, 109.0],
          [13.2, 109.1],
          [12.2451, 109.1943], // Nha Trang
          [11.5, 108.5],
          [10.7769, 106.7009], // HCM
        ];

        // Hàm lấy đoạn tuyến giữa 2 ga
        function getRouteSegment(startId, endId) {
          const stationOrder = ["Hanoi", "Vinh", "DaNang", "NhaTrang", "HCM"];
          const idxMap = {
            Hanoi: 0,
            Vinh: 3,
            DaNang: 5,
            NhaTrang: 8,
            HCM: 10,
          };
          const startIdx = idxMap[startId];
          const endIdx = idxMap[endId];
          if (startIdx < endIdx) {
            return realRoute.slice(startIdx, endIdx + 1);
          } else {
            return realRoute.slice(endIdx, startIdx + 1).reverse();
          }
        }

        // Hàm vẽ đường đi với hiệu ứng và đường cong
        function drawRoute(startId, endId) {
          if (routeLine) {
            map.removeLayer(routeLine);
            routeLine = null;
          }
          markers.forEach((m) => map.removeLayer(m));
          markers = [];

          const latlngs = getRouteSegment(startId, endId);

          // Đường đi mỏng hơn và cong
          routeLine = L.polyline([latlngs[0]], {
            color: "#2563eb",
            weight: 1,
            opacity: 0.9,
            lineCap: "round",
          }).addTo(map);

          // Hiệu ứng vẽ tuyến đường
          function animateLine(i) {
            if (i < latlngs.length) {
              routeLine.addLatLng(latlngs[i]);
              setTimeout(() => animateLine(i + 1), 250);
            }
          }
          animateLine(1);

          // Đặt marker cho các ga đầu/cuối
          const stationCoords = {
            Hanoi: [21.0285, 105.8542],
            Vinh: [18.6822, 105.6814],
            DaNang: [16.0678, 108.2208],
            NhaTrang: [12.2451, 109.1943],
            HCM: [10.7769, 106.7009],
          };
          [startId, endId].forEach((id, idx) => {
            const marker = L.marker(stationCoords[id], { riseOnHover: true })
              .addTo(map)
              .bindPopup(
                stations[id].name + (idx === 0 ? " (Bắt đầu)" : " (Kết thúc)")
              );
            markers.push(marker);
          });

          map.fitBounds(L.polyline(latlngs).getBounds(), { padding: [30, 30] });
        }

        // Hàm định dạng thời gian
        const formatTime = (totalHours) => {
          const hours = Math.floor(totalHours);
          const minutes = Math.round((totalHours - hours) * 60);
          if (hours > 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `${days} ngày ${remainingHours} giờ ${minutes} phút`;
          }
          return `${hours} giờ ${minutes} phút`;
        };

        // Hàm chính để xử lý sự kiện click
        const handleCompare = () => {
          const startId = startStationSelect.value;
          const endId = endStationSelect.value;

          // Kiểm tra nếu ga đi và ga đến trùng nhau
          if (startId === endId) {
            resultsContainer.classList.add("hidden");
            // Thay vì alert, sử dụng một modal hoặc hiển thị thông báo trên UI
            const messageBox = document.createElement("div");
            messageBox.classList.add(
              "fixed",
              "top-1/2",
              "left-1/2",
              "-translate-x-1/2",
              "-translate-y-1/2",
              "bg-red-500",
              "text-white",
              "p-4",
              "rounded-xl",
              "shadow-lg",
              "z-50"
            );
            messageBox.innerText = "Ga đi và Ga đến không được trùng nhau!";
            document.body.appendChild(messageBox);
            setTimeout(() => messageBox.remove(), 3000);
            return;
          }

          const startDistance = stations[startId].distance;
          const endDistance = stations[endId].distance;
          const distance = Math.abs(endDistance - startDistance); // Quãng đường di chuyển

          // Tính toán thời gian
          const hightechHours = distance / speeds.hightech;
          const traditionalHours = distance / speeds.traditional;
          const timeSavedHours = traditionalHours - hightechHours;

          // Cập nhật giao diện
          hightechTimeSpan.innerText = formatTime(hightechHours);
          traditionalTimeSpan.innerText = formatTime(traditionalHours);
          timeSavedSpan.innerText = formatTime(timeSavedHours);

          // Cập nhật biểu đồ tiến độ
          const hightechPercentage = (hightechHours / traditionalHours) * 100;
          hightechProgressDiv.style.width = `${hightechPercentage}%`;

          // Hiển thị khu vực kết quả
          resultsContainer.classList.remove("hidden");

          // Khởi tạo và vẽ bản đồ
          initMap();
          drawRoute(startId, endId);
        };

        // Gán sự kiện cho nút "Bắt đầu so sánh"
        compareBtn.addEventListener("click", handleCompare);

        // Hàm khởi tạo bản đồ và marker các ga lớn
        function initMap() {
          if (map) return;
          map = L.map("vietnam-map");

          // Fit toàn bộ Việt Nam
          map.fitBounds([
            [23.4, 102.1],
            [8.3, 109.6],
          ]);

          // Dùng tile nền sáng hơn
          L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
            {
              attribution: "© OpenStreetMap, © CartoDB",
              maxZoom: 19,
            }
          ).addTo(map);

          // Fetch và vẽ ranh giới Việt Nam
          fetch(
            "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_VNM_0.json"
          )
            .then((res) => res.json())
            .then((vn) => {
              // 1. Lớp viền đen ngoài cùng
              L.geoJSON(vn, {
                style: {
                  color: "#000000",
                  weight: 52,
                  opacity: 1,
                  fillOpacity: 0,
                },
                interactive: false,
              }).addTo(map);

              // 2. Lớp viền trắng
              L.geoJSON(vn, {
                style: {
                  color: "#ffffff",
                  weight: 48,
                  opacity: 1,
                  fillOpacity: 0,
                },
                interactive: false,
              }).addTo(map);

              // 3. Lớp viền đỏ đậm
              L.geoJSON(vn, {
                style: {
                  color: "#d70000",
                  weight: 32,
                  opacity: 1,
                  fillOpacity: 0,
                },
                interactive: false,
              }).addTo(map);

              // 4. Lớp viền trắng trong cùng
              L.geoJSON(vn, {
                style: {
                  color: "#ffffff",
                  weight: 16,
                  opacity: 1,
                  fillOpacity: 0,
                },
                interactive: false,
              }).addTo(map);
            });

          // Hiển thị marker các ga lớn mặc định
          Object.entries(stationCoords).forEach(([id, coord]) => {
            L.marker(coord).addTo(map).bindPopup(stations[id].name);
          });

          // Thêm text label cho các ga lớn
          const gaLabels = [
            { name: "Ga Hà Nội", coord: [21.0285, 105.8542] },
            { name: "Ga Vinh", coord: [18.6822, 105.6814] },
            { name: "Ga Đà Nẵng", coord: [16.0678, 108.2208] },
            { name: "Ga Nha Trang", coord: [12.2451, 109.1943] },
            { name: "Ga TP. Hồ Chí Minh", coord: [10.7769, 106.7009] },
          ];
          gaLabels.forEach((label) => {
            L.marker(label.coord, {
              icon: L.divIcon({
                className: "custom-label",
                html: `<span style="background:rgba(255,255,255,0.85);padding:2px 10px;border-radius:4px;font-weight:500;font-size:11px;color:#2563eb;border:1px solid #2563eb;white-space:nowrap;">${label.name}</span>`,
                iconAnchor: [0, 0],
              }),
              interactive: false,
              keyboard: false,
            }).addTo(map);
          });

          // Đặc khu Hoàng Sa, Trường Sa
          L.marker([16.5, 112.0], {
            icon: L.divIcon({
              className: "custom-label",
              html: `<span style="background:rgba(255,255,255,0.85);padding:2px 10px;border-radius:4px;font-weight:500;font-size:11px;color:#e11d48;border:1px solid #e11d48;white-space:nowrap;">Đặc khu Hoàng Sa</span>`,
              iconAnchor: [0, 0],
            }),
            interactive: false,
            keyboard: false,
          }).addTo(map);

          L.marker([10.0, 114.3], {
            icon: L.divIcon({
              className: "custom-label",
              html: `<span style="background:rgba(255,255,255,0.85);padding:2px 10px;border-radius:4px;font-weight:500;font-size:11px;color:#e11d48;border:1px solid #e11d48;white-space:nowrap;">Đặc khu Trường Sa</span>`,
              iconAnchor: [0, 0],
            }),
            interactive: false,
            keyboard: false,
          }).addTo(map);
        }

        // Khi chưa chọn đủ ga, ẩn kết quả và chỉ hiện bản đồ với marker các ga
        compareBtn.addEventListener("click", () => {
          const startId = startStationSelect.value;
          const endId = endStationSelect.value;

          // Nếu chưa chọn đủ ga
          if (!startId || !endId) {
            resultsContainer.classList.add("hidden");
            return;
          }

          // Kiểm tra nếu ga đi và ga đến trùng nhau
          if (startId === endId) {
            resultsContainer.classList.add("hidden");
            // Thay vì alert, sử dụng một modal hoặc hiển thị thông báo trên UI
            const messageBox = document.createElement("div");
            messageBox.classList.add(
              "fixed",
              "top-1/2",
              "left-1/2",
              "-translate-x-1/2",
              "-translate-y-1/2",
              "bg-red-500",
              "text-white",
              "p-4",
              "rounded-xl",
              "shadow-lg",
              "z-50"
            );
            messageBox.innerText = "Ga đi và Ga đến không được trùng nhau!";
            document.body.appendChild(messageBox);
            setTimeout(() => messageBox.remove(), 3000);
            return;
          }

          const startDistance = stations[startId].distance;
          const endDistance = stations[endId].distance;
          const distance = Math.abs(endDistance - startDistance); // Quãng đường di chuyển

          // Tính toán thời gian
          const hightechHours = distance / speeds.hightech;
          const traditionalHours = distance / speeds.traditional;
          const timeSavedHours = traditionalHours - hightechHours;

          // Cập nhật giao diện
          hightechTimeSpan.innerText = formatTime(hightechHours);
          traditionalTimeSpan.innerText = formatTime(traditionalHours);
          timeSavedSpan.innerText = formatTime(timeSavedHours);

          // Cập nhật biểu đồ tiến độ
          const hightechPercentage = (hightechHours / traditionalHours) * 100;
          hightechProgressDiv.style.width = `${hightechPercentage}%`;

          // Hiển thị khu vực kết quả
          resultsContainer.classList.remove("hidden");

          // Khởi tạo và vẽ bản đồ
          initMap();
          drawRoute(startId, endId);
        });

        // Khởi tạo bản đồ khi load trang
        initMap();
      });
