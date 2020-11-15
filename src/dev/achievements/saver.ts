type ISavedAchievement = Record<number, IFullData>;

interface IAchievementsSaver {
    data: Record<string, Record<string, ISavedAchievement>>
    _format: number
}

Saver.addSavesScope("AchievementsScope",
    function read(scope: IAchievementsSaver) {
        let groups: IAchievementsSaver["data"] = {};
        if (!scope._format) {
            Logger.Log("Old saves detected. Converting...", LOG_TAG);
            for (let groupKey in scope) {
                const group: Record<string, ISavedAchievement> = {};
                // @ts-ignore
                const data = scope[groupKey];

                for (let key in data) {
                    group[key] = {
                        [Player.get()]: data[key]
                    };
                }

                groups[groupKey] = group;
            }
        } else {
            groups = scope.data;
        }

        for (let groupKey in groups) {
            const group = AchievementAPI.getGroup(groupKey);
            if (!group) {
                Logger.Log(`Group with uid '${groupKey}' not found. Skipping...`, "WARNING");
                continue;
            }

            const data = groups[groupKey];
            for (let achievementKey in data) {
                const child = group.getChild(achievementKey);
                if (!child) {
                    Logger.Log(`Achievement with uid '${achievementKey}' not found. Skipping...`, "WARNING");
                    continue;
                }

                child.deserialize(data[achievementKey]);
            }
        }
    },

    function save() {
        const data: IAchievementsSaver["data"] = {};

        for (let groupKey in AchievementAPI.groups) {
            const group = AchievementAPI.groups[groupKey];
            const saved: Record<string, ISavedAchievement> = {};
            for (let childKey in group.children) {
                saved[childKey] = group.children[childKey].serialize();
            }

            data[groupKey] = saved;
        }

        return {
            data: data,
            _format: 1
        };
    }
);