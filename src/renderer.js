document.addEventListener('DOMContentLoaded', () => {
    const dropdownContainer = document.getElementById('dropdown-container');
    const quitBtn = document.getElementById('quit-btn');

    function formatHardwareRes(resString) {
        const parts = resString.match(/(\d+)x(\d+)x(\d+)@(\d+)/);
        if (!parts) return resString;
        return `${parts[1]} x ${parts[2]} @ ${parts[4]}Hz`;
    }

    const populateDisplays = async () => {
        dropdownContainer.innerHTML = '';
        const displays = await window.api.getDisplays();

        displays.forEach(display => {
            const group = document.createElement('div');
            group.className = 'display-group';

            const label = document.createElement('label');
            label.className = 'display-label';
            label.textContent = display.label;
            group.appendChild(label);

            const select = document.createElement('select');
            select.className = 'resolution-select';

            const currentRes = display.currentResolution;

            // Create and append the "Scaled" resolutions group
            const scaledOptgroup = document.createElement('optgroup');
            scaledOptgroup.label = 'Scaled (Recommended)';
            (display.scaledModes || []).forEach(mode => {
                const option = document.createElement('option');
                // **FIX:** Value now includes resolution, hz, and scaling status
                option.value = `scaled:${mode.res}:${mode.hz}:${mode.scaling}`;
                option.textContent = `${mode.res} @ ${mode.hz}Hz`;
                if (mode.res === currentRes) {
                    option.selected = true;
                }
                scaledOptgroup.appendChild(option);
            });
            select.appendChild(scaledOptgroup);

            // Create and append the "Hardware" resolutions group
            const hardwareOptgroup = document.createElement('optgroup');
            hardwareOptgroup.label = 'Hardware Modes (Advanced)';
            (display.hardwareModes || []).forEach(resString => {
                const option = document.createElement('option');
                option.value = `hardware:${resString}`;
                option.textContent = formatHardwareRes(resString);
                if (resString.startsWith(currentRes)) {
                    option.selected = true;
                }
                hardwareOptgroup.appendChild(option);
            });
            select.appendChild(hardwareOptgroup);

            select.addEventListener('change', async (event) => {
                const selectedResolution = event.target.value;
                const result = await window.api.setResolution(selectedResolution);
                if (result.success) {
                    window.api.hideWindow();
                } else {
                    alert(`Failed to set resolution: ${result.error}`);
                }
            });

            group.appendChild(select);
            dropdownContainer.appendChild(group);
        });
    };

    quitBtn.addEventListener('click', () => {
        window.api.quitApp();
    });

    populateDisplays();
});
