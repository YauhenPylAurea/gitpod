// Copyright (c) 2021 Gitpod GmbH. All rights reserved.
// Licensed under the GNU Affero General Public License (AGPL).
// See License-AGPL.txt in the project root for license information.

package bastion

import (
	"context"

	"github.com/gitpod-io/gitpod/local-app/api"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type LocalAppService struct {
	b *Bastion
	s *SSHConfigWritingCallback
	api.UnimplementedLocalAppServer
}

func NewLocalAppService(b *Bastion, s *SSHConfigWritingCallback) *LocalAppService {
	return &LocalAppService{
		b: b,
		s: s,
	}
}

func (s *LocalAppService) TunnelStatus(req *api.TunnelStatusRequest, srv api.LocalApp_TunnelStatusServer) error {
	if !req.Observe {
		return srv.Send(&api.TunnelStatusResponse{
			Tunnels: s.b.Status(req.InstanceId),
		})
	}

	sub, err := s.b.Subscribe(req.InstanceId)
	if err == ErrTooManySubscriptions {
		return status.Error(codes.ResourceExhausted, "too many subscriptions")
	}
	if err != nil {
		return status.Error(codes.Internal, err.Error())
	}
	defer sub.Close()

	for {
		select {
		case <-srv.Context().Done():
			return nil
		case update := <-sub.Updates():
			if update == nil {
				return nil
			}
			err := srv.Send(&api.TunnelStatusResponse{
				Tunnels: update,
			})
			if err != nil {
				return err
			}
		}
	}
}

func (s *LocalAppService) AutoTunnel(ctx context.Context, req *api.AutoTunnelRequest) (*api.AutoTunnelResponse, error) {
	s.b.AutoTunnel(req.InstanceId, req.Enabled)
	return &api.AutoTunnelResponse{}, nil
}

func (s *LocalAppService) ResolveSSHConnection(ctx context.Context, req *api.ResolveSSHConnectionRequest) (*api.ResolveSSHConnectionResponse, error) {
	ws, ok := s.b.getWorkspace(req.InstanceId)
	if !ok {
		return nil, status.Error(codes.NotFound, "workspace not found")
	}
	return &api.ResolveSSHConnectionResponse{
		Host:       ws.WorkspaceID,
		ConfigFile: s.s.Path,
	}, nil
}
