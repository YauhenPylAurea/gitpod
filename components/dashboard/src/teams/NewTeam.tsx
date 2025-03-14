/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { FormEvent, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { getGitpodService } from "../service/service";
import { TeamsContext } from "./teams-context";

export default function () {
    const { setTeams } = useContext(TeamsContext);
    const history = useHistory();

    const [ creationError, setCreationError ] = useState<Error>();
    let name = '';
    const createTeam = async (event: FormEvent) => {
        event.preventDefault();
        try {
            const team = await getGitpodService().server.createTeam(name);
            const teams = await getGitpodService().server.getTeams();
            setTeams(teams);
            history.push(`/${team.slug}`);
        } catch (error) {
            console.error(error);
            setCreationError(error);
        }
    }

    useEffect(() => { document.title = 'New Team — Gitpod' }, []);

    return <div className="flex flex-col w-96 mt-24 mx-auto items-center">
        <h1>New Team</h1>
        <p className="text-gray-500 text-center text-base">Teams allow you to <strong>group multiple projects</strong>, <strong>collaborate with others</strong>, <strong>manage subscriptions</strong> with one centralized billing, and more. <a className="gp-link" href="https://www.gitpod.io/docs/teams/">Learn more</a></p>
        <form className="mt-16 w-full" onSubmit={createTeam}>
            <div className="border rounded-xl p-6 border-gray-100 dark:border-gray-800">
                <h3 className="text-center text-xl mb-6">What's your team's name?</h3>
                <h4>Team Name</h4>
                <input className={`w-full${!!creationError ? ' error' : ''}`} type="text" onChange={event => name = event.target.value} />
                {!!creationError && <p className="text-gitpod-red">{creationError.message.replace(/Request \w+ failed with message: /, '')}</p>}
            </div>
            <div className="flex flex-row-reverse space-x-2 space-x-reverse mt-2">
                <button type="submit">Create Team</button>
                <button className="secondary" onClick={() => history.push('/')}>Cancel</button>
            </div>
        </form>
    </div>;
}